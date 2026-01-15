#!/bin/bash

export EKS_CLUSTER_NAME="AccountsApiCluster"
export EKS_LOAD_BALANCER_SERVICE_NAME="adm-accounts-api-loadbalancer"
export EKS_LOAD_BALANCER_NAMESPACE="default"
export HOSTED_ZONE_NAME="ebpublishing-admanager-staging2.com"
export HOSTED_ZONE_SUBDOMAIN="accounts"

./run.sh \
    $EKS_CLUSTER_NAME \
    $EKS_LOAD_BALANCER_SERVICE_NAME \
    $EKS_LOAD_BALANCER_NAMESPACE \
    $HOSTED_ZONE_NAME \
    $HOSTED_ZONE_SUBDOMAIN