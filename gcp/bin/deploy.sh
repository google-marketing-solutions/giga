#!/bin/bash

# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Exit on error
set -e

npm ci

# Navigate to project root
cd "$(dirname "$0")/.."

echo "🔨 Running local build to check for TypeScript and linting errors..."
if ! npm run build; then
  echo "❌ Build failed. Please fix the TypeScript/linting errors before deploying."
  exit 1
fi
echo "✅ Local build passed!"

# Load configuration
source configuration.env

# Check if variables are set and not default
if [ -z "$GCP_PROJECT_ID" ] || [ "$GCP_PROJECT_ID" == "your-gcp-project-id" ]; then
  echo "Error: Please set your GCP_PROJECT_ID in configuration.env"
  exit 1
fi

if [ -z "$CLOUD_RUN_GCP_PROJECT_ID" ] || [ "$CLOUD_RUN_GCP_PROJECT_ID" == "your-cloud-run-gcp-project-id" ]; then
  echo "Error: Please set your CLOUD_RUN_GCP_PROJECT_ID in configuration.env"
  exit 1
fi

if [ -z "$CLOUD_RUN_REGION" ]; then
  echo "Error: Please set your CLOUD_RUN_REGION in configuration.env"
  exit 1
fi

if [ -z "$SERVICE_NAME" ]; then
  echo "Error: Please set your SERVICE_NAME in configuration.env"
  exit 1
fi

# Set the project ID
gcloud config set project $CLOUD_RUN_GCP_PROJECT_ID

# Enable the required services
gcloud services enable run.googleapis.com --project $CLOUD_RUN_GCP_PROJECT_ID
gcloud services enable containerregistry.googleapis.com --project $CLOUD_RUN_GCP_PROJECT_ID
gcloud services enable cloudbuild.googleapis.com --project $CLOUD_RUN_GCP_PROJECT_ID

# Construct the service account email
SERVICE_ACCOUNT_EMAIL="${SERVICE_NAME}@${CLOUD_RUN_GCP_PROJECT_ID}.iam.gserviceaccount.com"

# Check if the service account exists, if not run setup.sh
echo "🔎 Checking for service account: $SERVICE_ACCOUNT_EMAIL..."
if ! gcloud iam service-accounts describe "$SERVICE_ACCOUNT_EMAIL" --project="$CLOUD_RUN_GCP_PROJECT_ID" --quiet &> /dev/null; then
  echo "🤔 Service account not found. Running setup.sh..."
  sh ./bin/setup.sh
else
  echo "✅ Service account found."
fi

# Define the image name
IMAGE_NAME="gcr.io/$CLOUD_RUN_GCP_PROJECT_ID/$SERVICE_NAME"

# Use the bucket specified in configuration.env
BUILD_BUCKET="gs://${GCP_BUCKET}"

# Build the Docker image using Google Cloud Build
gcloud builds submit --tag $IMAGE_NAME \
  --project $CLOUD_RUN_GCP_PROJECT_ID \
  --gcs-source-staging-dir="${BUILD_BUCKET}/source" \
  --gcs-log-dir="${BUILD_BUCKET}/logs"

# Create a YAML version of the configuration for gcloud
sed 's/=/:\ /' configuration.env | sed -E 's/: (.*)$/: "\1"/' > env.yaml

# Set default memory if not provided in configuration.env
CLOUD_RUN_MEMORY="${CLOUD_RUN_MEMORY:-4Gi}"

# Deploy the image to Google Cloud Run
gcloud beta run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --region $CLOUD_RUN_REGION \
  --project $CLOUD_RUN_GCP_PROJECT_ID \
  --env-vars-file=env.yaml \
  --service-account $SERVICE_ACCOUNT_EMAIL \
  --memory $CLOUD_RUN_MEMORY \
  --iap \
  --no-allow-unauthenticated

# Grant access to the specified Google Group if configured
if [ -n "$IAP_ACCESS_GROUP" ]; then
  echo "🔑 Granting 'IAP-secured Web App User' role to group: $IAP_ACCESS_GROUP on the service..."
  gcloud projects add-iam-policy-binding "$CLOUD_RUN_GCP_PROJECT_ID" \
    --member="group:$IAP_ACCESS_GROUP" \
    --role="roles/iap.httpsResourceAccessor" \
    --quiet
  echo "✅ IAM permissions granted to group: $IAP_ACCESS_GROUP"
fi


# Clean up
rm -f env.yaml
