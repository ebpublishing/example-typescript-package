#!/bin/bash

EKS_CLUSTER_NAME=$1
EKS_LOAD_BALANCER_SERVICE_NAME=$2
EKS_LOAD_BALANCER_NAMESPACE=$3
HOSTED_ZONE_NAME=$4
SUBDOMAIN=$5
export KUBECONFIG=/root/.kube/config
aws eks update-kubeconfig --region $AWS_REGION --name $EKS_CLUSTER_NAME
#aws elbv2 describe-load-balancers
#aws eks describe-cluster --name $EKS_CLUSTER_NAME
ts-node run.ts \
    $EKS_CLUSTER_NAME \
    $EKS_LOAD_BALANCER_SERVICE_NAME \
    $EKS_LOAD_BALANCER_NAMESPACE \
    $AWS_REGION \
    $HOSTED_ZONE_NAME \
    $SUBDOMAIN