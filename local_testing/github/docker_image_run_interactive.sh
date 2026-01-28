#!/bin/bash

read_properties()
{
  file="$1"
  while IFS="=" read -r key value; do
    case "$key" in
      '#'*) ;;
      *)
        eval "$key=\"$value\""
    esac
  done < "$file"
}

read_properties $BROYDEN_HOME/config/aws/ebpublishing-admanager-pkg-staging.settings

docker run -it --entrypoint "/bin/bash" -v $PWD../../..:/broyden \
    -v ./../../src:/broyden/ts/src \
    --workdir /broyden \
    -e AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
    -e AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
    -e AWS_REGION=$AWS_REGION \
    -e AWS_ACCOUNT_ID=$AWS_ACCOUNT_ID \
    -e GH_ACCESS_TOKEN=$GH_ACCESS_TOKEN \
    -e GH_ORGANIZATION_NAME=$GH_ORGANIZATION_NAME \
    -e GH_ENVIRONMENT_NAME=$GH_ENVIRONMENT_NAME \
    -e GH_REPOSITORY_NAME=$GH_REPOSITORY_NAME \
    broyden_package_test_dns
