<!--
Copyright 2026 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-->

<img align="left" width="150" src="assets/logo.png" alt="logo" />

# GIGA: Gemini Insights Generation Analysis

[![GitHub last commit](https://img.shields.io/github/last-commit/google-marketing-solutions/giga)](https://github.com/google-marketing-solutions/giga/commits)

**Disclaimer: This is not an official Google product.**

[Overview](#overview) •
[Challenge Addressed](#challenge-addressed) •
[Outcome & Impact](#outcome--impact) •
[Services Used](#services-used) •
[Limitations](#limitations) •
[Prerequisites](#prerequisites) •
[Get Started](#get-started) •

## Latest Updates

- **May 2026:** Initial version of GIGA on Google Cloud Run.
- **April 2026:** Account ID selector for Google Ads Manager accounts and added multi-select growth metrics.
- **March 2026:**
  - Agentic Insights Follow-up to power dynamic, ongoing chat analysis functionality.
  - Geographic features including support for location and language criterion lookups using Gemini.
  - [Copy Cat](https://github.com/google-marketing-solutions/copycat) format for campaign output generation.
- **February 2026:** Introduced user-specific property management to allow individual overrides of the Ads Account ID and Developer Token.
- **January 2026:** Added an option to specify the output language for generated insights.
- **December 2025:** Added performance metrics for campaign creation and introduced Dark Mode.
- **November 2025:** Added a direct "Export to Sheet" functionality for generated insights and keyword trends. Allowed customization of growth metrics (YoY, MoM, Last Month vs Average).

## Overview

GIGA is an AI-powered keyword intelligence and campaign generation tool. It
discovers trending search terms, clusters keywords semantically using Gemini,
and generates actionable insights and campaign recommendations to help advertisers
optimize their marketing strategies.

<p align="center">
  <img src="assets/screencast_demo_data.gif" alt="Demo Screencast" width="600"/>
</p>

_Please note: Search volume and other metrics are randomized for demonstration purposes._

## Challenge Addressed

Clients want to stay ahead of current search/keyword trends and capitalize on them quickly. Up-to-date insights into search trends are crucial for optimizing ad campaigns and driving sales in key product categories.

## Outcome & Impact

GIGA provides a clustering of all keyword ideas related to the input topic keywords. The solution also provides an insights summary page and recommendations for campaigns to create in order to capture current trending topics.

This provides clients with actionable, strategic insights for making marketing decisions and helps them create campaigns based on these insights.

Explore the search volume history of your seed keywords:

<p align="center">
  <img src="assets/explore_search_volume.png" alt="Explore Search Volume" width="400"/>
</p>

Analyze generated clusters to identify trending topics:

<p align="center">
  <img src="assets/explore_clusters.png" alt="Explore Clusters" width="400"/>
</p>

Inspect trending keywords:

<p align="center">
  <img src="assets/trends.png" alt="Explore Clusters" width="400"/>
</p>

## Services Used

This project utilizes the following Google services:

- **[Gemini Enterprise Agent Platform](https://cloud.google.com/products/gemini-enterprise-agent-platform):** Used for generating intelligent insights and clustering keywords using Gemini models.
- **[Google Ads API (Keyword Planner)](https://developers.google.com/google-ads/api/docs/keyword-planning/generate-keyword-ideas):** Used for fetching keyword ideas, search volumes, and historical metrics.

## Limitations

- **[Keyword Idea Service](https://developers.google.com/google-ads/api/docs/keyword-planning/generate-keyword-ideas):** This service provides data based on full months. Consequently, data for the current month is not yet available; it becomes accessible only after the month has concluded. Additionally, there is a ≈10 days delay (e.g. on 10th March, data for complete February will be available).
- **[Keyword Volume](https://developers.google.com/google-ads/api/docs/keyword-planning/generate-keyword-ideas#historical_metrics):** Please note that keyword volume figures are rounded.

## Prerequisites

- **[Google Ads Account with a Developer Token](https://developers.google.com/google-ads/api/docs/access-levels):** The developer token needs **"Basic"** or **"Standard"** access level ("Test Account Access" is not sufficient). Additionally, it requires the **"Permissible Use"** for **"Researching keywords and recommendations"** (see [permissible use](https://developers.google.com/google-ads/api/docs/api-policy/access-levels#permissible-use) and [how to change permissible use](https://developers.google.com/google-ads/api/docs/api-policy/access-levels#how-to-change-permissible-use) for details).
- Google Cloud Project with [Gemini Enterprise Agent Platform](https://cloud.google.com/products/gemini-enterprise-agent-platform) enabled

## Get Started

To get started with GIGA, clone the repository and copy `configuration.env.template` to `configuration.env` and add all necessary information.

### Obtaining a Google Ads Refresh Token

You will need a Google Ads Developer Token to access and use the Google Ads Agent that is part of GIGA. Currently, once a developer token is associated with a specific GCP project, neither the token nor the project can be changed. As such, your team members who use *different* developer tokens must also use different OAuth Clients created in separate GCP projects for accessing the agent. This does not affect shared BigQuery data or other GCP resources.

First navigate to your desired project in GCP, enable the [Google Ads API](https://console.cloud.google.com/apis/library/googleads.googleapis.com) then follow the steps below.

> Note: This process assumes you are already in a possesion of a Google Ads Developer Token. If not, please follow the instructions at https://developers.google.com/google-ads/api/docs/api-policy/developer-token#new-token to obtain a new one.

#### Step 1: Configure OAuth Consent Screen

1. Go to the [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent) page in the Google Cloud Console.
2. Choose **External** for the User Type and click **Create**.
3. Enter **GIGA** as the **App name**.
4. Enter your email address for the **User support email**.
5. Click **Save and Continue** through the rest of the sections.

#### Step 2: Create OAuth Client ID

1. Go to the [Credentials](https://console.cloud.google.com/apis/credentials) page.
2. Click **+ Create Credentials** and select **OAuth client ID**.
3. Select **Web application** as the **Application type**.
4. Enter **GIGA Google Ads OAuth Client** as the **Name**.
5. Add the following URI under **Authorized redirect URIs**: `https://developers.google.com/oauthplayground`
6. Click **Create**.
7. A dialog will appear showing your **Client ID** and **Client Secret**. Click **Download JSON** to have a persistent version of the settings.

#### Step 3: Obtain an OAuth Refresh Token

1. Navigate to the [OAuth Playground](https://developers.google.com/oauthplayground/#step1&scopes=https%3A//www.googleapis.com/auth/adwords&url=https%3A//&content_type=application/json&http_method=GET&useDefaultOauthCred=checked&oauthEndpointSelect=Google&oauthAuthEndpointValue=https%3A//accounts.google.com/o/oauth2/auth&oauthTokenEndpointValue=https%3A//oauth2.googleapis.com/token&includeCredentials=unchecked&accessTokenType=bearer&autoRefreshToken=unchecked&accessType=offline&forceAprovalPrompt=checked&response_type=code)
2. On the right-hand-side in the **OAuth 2.0 Configuration**
   * Select "Server-side" **OAuth flow**
   * Select "Google" as the **OAuth endpoint**
   * Enter your OAuth Client ID and secret (Step 2.7 above)
3. On the left-hand-side in **Select & authorize APIs**
   * Add https://www.googleapis.com/auth/adwords
   * Click **Authorize APIs** and complete the popup OAuth flow
4. In the new screen on the left-hand-side, click **Exchange authorization code for tokens**
5. Copy the resulting JSON in the **Request/Response** view and save it locally to have a persistent version of the settings.

## Run locally

Run the server locally

```bash
sh bin/run_local.sh
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deploy

This deploys GIGA on Cloud Run and uses Identity Aware Proxy (IAP) for authentication so that only authenticated users can access the app.

```sh
sh bin/deploy.sh
```

After deployment is done, you'll see a link to the deployed app in the terminal output.

