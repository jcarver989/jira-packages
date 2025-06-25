#!/usr/bin/env bash

set -e

SCHEMA_DIR=./open-api-specs
OUT_DIR=./src/generated

CLOUD_SPEC_FILE="$SCHEMA_DIR/jiraCloudSpec.json"
SOFTWARE_SPEC_FILE="$SCHEMA_DIR/jiraSoftwareSpec.json"

rm -rf $OUT_DIR
mkdir -p $SCHEMA_DIR
mkdir -p $OUT_DIR/jira-cloud
mkdir -p $OUT_DIR/jira-software

echo "Downloading API specs for Jira..."
curl https://dac-static.atlassian.com/cloud/jira/platform/swagger-v3.v3.json -o $CLOUD_SPEC_FILE
curl https://dac-static.atlassian.com/cloud/jira/software/swagger.v3.json -o $SOFTWARE_SPEC_FILE

# Fix malformed comment in spec file that would generate invalid TypeScript comments
sed -i 's|For example, \*\/example|For example, \/example|g' $CLOUD_SPEC_FILE


CLOUD_APIS="Issues:IssueFields:WorkflowStatuses:IssueSearch"
CLOUD_MODELS="IssueBean:IssueChangeLog:Configuration:SearchAndReconcileRequestBean:StatusDetails:BulkChangelogRequestBean"

SOFTWARE_APIS="Board:Backlog:Sprint"
SOFTWARE_MODELS="BoardConfigBean:Configuration:SprintBean:GetAllBoards200Response"

echo "Generating TypeScript definitions"
npx openapi-generator-cli generate -i $CLOUD_SPEC_FILE  -g typescript-fetch -o $OUT_DIR/jira-cloud --global-property apis="$CLOUD_APIS",models,supportingFiles
npx openapi-generator-cli generate -i $SOFTWARE_SPEC_FILE  -g typescript-fetch -o $OUT_DIR/jira-software --global-property apis="$SOFTWARE_APIS",models,supportingFiles

# Fix code in generated file
echo "export { CreateCustomFieldRequest } from './models/index'" >> $OUT_DIR/jira-cloud/index.ts

# Fix code in generated file
FIELDS_FILE="$OUT_DIR/jira-cloud/models/Fields.ts"
sed -i "s/mandatoryFieldForADF/adf/g" $FIELDS_FILE
sed -i "s/mandatoryField/raw/g" $FIELDS_FILE
sed -i "s/return MandatoryFieldValueFromJSONTyped(json, ignoreDiscriminator)/return MandatoryFieldValueFromJSONTyped(json, ignoreDiscriminator) as any/g" $FIELDS_FILE
