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

# A script to find a Cloud Run service account and grant it the Vertex AI User role.

# Navigate to project root
cd "$(dirname "$0")/.."

# --- Configuration ---
# Read configuration from configuration.env
if [ -f configuration.env ]; then
  export $(cat configuration.env | grep -v '#' | awk '/=/ {print $1}')
fi

# Check if variables are set and not default
if [ -z "$SERVICE_NAME" ] || [ "$SERVICE_NAME" == "your-cloud-run-service-name" ]; then
  echo "Error: Please set your SERVICE_NAME in configuration.env"
  exit 1
fi

if [ -z "$CLOUD_RUN_REGION" ] || [ "$CLOUD_RUN_REGION" == "your-gcp-region" ]; then
  echo "Error: Please set your CLOUD_RUN_REGION in configuration.env"
  exit 1
fi

if [ -z "$CLOUD_RUN_GCP_PROJECT_ID" ] || [ "$CLOUD_RUN_GCP_PROJECT_ID" == "your-cloud-run-gcp-project-id" ]; then
  echo "Error: Please set your CLOUD_RUN_GCP_PROJECT_ID in configuration.env"
  exit 1
fi

echo "▶️ Starting permission script for service '$SERVICE_NAME' in region '$CLOUD_RUN_REGION'..."

# 2. Set the Project ID from configuration
PROJECT_ID=$CLOUD_RUN_GCP_PROJECT_ID
echo "✅ Using Project ID: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# 3. Grant invocation permissions
CURRENT_USER=$(gcloud config get-value account)
if [[ -z "$CURRENT_USER" ]]; then
    echo "❌ Error: Could not get current user from gcloud config."
    exit 1
fi

if [[ -z "$IAP_ACCESS_GROUP" ]]; then
    echo "ℹ️  No IAP_ACCESS_GROUP found. Granting access directly to $CURRENT_USER..."
    echo "🔑 Granting 'IAP-secured Web App User' role to $CURRENT_USER..."
    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member="user:$CURRENT_USER" \
        --role="roles/iap.httpsResourceAccessor" \
        --quiet --condition=None
    echo "✅ IAM permissions granted to user."
else
    echo "ℹ️  IAP_ACCESS_GROUP is set. Skipping direct user grants in favor of group access logic."
fi

# 3. Enable the Cloud Build API and grant necessary permissions
echo "🔑 Enabling Cloud Build API and granting permissions..."
gcloud services enable serviceusage.googleapis.com cloudbuild.googleapis.com iap.googleapis.com generativelanguage.googleapis.com aiplatform.googleapis.com youtube.googleapis.com --project="$PROJECT_ID"

PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
if [[ -z "$PROJECT_NUMBER" ]]; then
  echo "❌ Error: Could not retrieve project number for project '$PROJECT_ID'."
  exit 1
fi

# 3b. Grant Cloud Run Invoker role to IAP Service Agent (Required for Direct IAP)
echo "🔑 Granting 'Cloud Run Invoker' role to IAP Service Agent..."
IAP_SA="service-${PROJECT_NUMBER}@gcp-sa-iap.iam.gserviceaccount.com"
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$IAP_SA" \
    --role="roles/run.invoker" \
    --quiet --condition=None
echo "✅ IAM permissions granted to IAP Service Agent."

# Grant the official Cloud Build service account the necessary roles
BUILD_SERVICE_ACCOUNT="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
echo "🔑 Granting 'Storage Object Viewer', 'Logs Writer', and 'Artifact Registry Writer' roles to the Cloud Build service account..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$BUILD_SERVICE_ACCOUNT" \
    --role="roles/storage.objectViewer" \
    --quiet --condition=None
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$BUILD_SERVICE_ACCOUNT" \
    --role="roles/logging.logWriter" \
    --quiet --condition=None
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$BUILD_SERVICE_ACCOUNT" \
    --role="roles/artifactregistry.writer" \
    --quiet --condition=None

# Also grant to the Compute Engine default service account which Cloud Build often defaults to
COMPUTE_SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
echo "🔑 Granting 'Storage Object Viewer', 'Logs Writer', and 'Artifact Registry Writer' roles to the Compute Engine default service account..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$COMPUTE_SERVICE_ACCOUNT" \
    --role="roles/storage.objectViewer" \
    --quiet --condition=None
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$COMPUTE_SERVICE_ACCOUNT" \
    --role="roles/logging.logWriter" \
    --quiet --condition=None
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$COMPUTE_SERVICE_ACCOUNT" \
    --role="roles/artifactregistry.writer" \
    --quiet --condition=None
echo "✅ Cloud Build permissions granted."

# 4. Create the service account for the service to run as
SERVICE_ACCOUNT_NAME="$SERVICE_NAME"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "🔎 Checking for service account: $SERVICE_ACCOUNT_EMAIL..."
if ! gcloud iam service-accounts describe "$SERVICE_ACCOUNT_EMAIL" --project="$PROJECT_ID" --quiet &> /dev/null; then
  echo "🤔 Service account not found. Creating..."
  gcloud iam service-accounts create "$SERVICE_ACCOUNT_NAME" \
    --display-name="$SERVICE_NAME Service Account" \
    --project="$PROJECT_ID"
  echo "✅ Service account created."
else
  echo "✅ Service account already exists."
fi

# 5. Grant necessary roles to the Service Account
echo "🔑 Granting 'Vertex AI User', 'Storage Object Viewer', 'Storage Object Creator', and 'Logs Writer' roles to $SERVICE_ACCOUNT_EMAIL..."

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/aiplatform.user" \
    --quiet --condition=None

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/storage.objectViewer" \
    --quiet --condition=None

echo "🔑 Creating custom role with exact storage.objects.create permission..."
# Create a custom role to grant exactly what is needed without using Admin roles
USE_CUSTOM_ROLE=true
if ! gcloud iam roles describe customStorageWriter --project="$PROJECT_ID" &> /dev/null; then
  if ! gcloud iam roles create customStorageWriter \
      --project="$PROJECT_ID" \
      --title="Custom Storage Writer" \
      --description="Role with exact storage.objects.create permission" \
      --permissions="storage.objects.create" \
      --quiet 2> /dev/null; then
    echo "⚠️  Could not create custom role. Falling back to roles/storage.objectCreator"
    USE_CUSTOM_ROLE=false
  fi
fi

if [ "$USE_CUSTOM_ROLE" = true ]; then
  ROLE_ID="projects/$PROJECT_ID/roles/customStorageWriter"
else
  ROLE_ID="roles/storage.objectCreator"
fi

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="$ROLE_ID" \
    --quiet --condition=None

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/logging.logWriter" \
    --quiet --condition=None

echo "🔑 Granting 'Storage Object Creator' role to the Vertex AI Service Agent..."
VERTEX_AI_SA="service-${PROJECT_NUMBER}@gcp-sa-aiplatform.iam.gserviceaccount.com"
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$VERTEX_AI_SA" \
    --role="roles/storage.objectCreator" \
    --quiet --condition=None

# 6. Ensure GCP_BUCKET has correct permissions
if [ -n "$GCP_BUCKET" ]; then
  echo "🔑 Granting storage permissions on gs://$GCP_BUCKET to Cloud Build and Compute service accounts..."
  gcloud storage buckets add-iam-policy-binding "gs://$GCP_BUCKET" \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/storage.admin" --quiet
    
  gcloud storage buckets add-iam-policy-binding "gs://$GCP_BUCKET" \
    --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
    --role="roles/storage.admin" --quiet
  echo "✅ Bucket permissions granted."
fi

# 7. Ensure gcr.io Artifact Registry repository exists for the project
echo "🔎 Checking if gcr.io Artifact Registry repository exists..."
if ! gcloud artifacts repositories describe gcr.io --project="$PROJECT_ID" --location=us --quiet &> /dev/null; then
  echo "🤔 gcr.io repository not found. Creating..."
  gcloud artifacts repositories create gcr.io \
    --repository-format=docker \
    --location=us \
    --project="$PROJECT_ID" \
    --description="Docker repository for gcr.io (created by setup.sh)"
  echo "✅ gcr.io repository created."
else
  echo "✅ gcr.io repository exists."
fi

echo "🎉 Success! Permission granted."
