FROM ubuntu:22.04

RUN apt-get update && \
apt-get install -y unzip && \
apt-get install -y tar && \
apt-get install -y gzip && \
apt-get install -y curl && \
apt-get install -y less && \
apt-get install -y wget && \
apt-get install -y groff 

RUN set -uex; \
    apt-get update; \
    apt-get install -y ca-certificates curl gnupg; \
    mkdir -p /etc/apt/keyrings; \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
     | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg; \
    NODE_MAJOR=22; \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" \
     > /etc/apt/sources.list.d/nodesource.list; \
    apt-get -qy update; \
    apt-get -qy install nodejs;


RUN npm install -g npm@latest && \
curl "https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip" -o "awscliv2.zip" && \
unzip awscliv2.zip && \
./aws/install && \
curl -O https://s3.us-west-2.amazonaws.com/amazon-eks/1.30.0/2024-05-12/bin/linux/arm64/kubectl && \
chmod +x ./kubectl && \
mv ./kubectl /usr/bin/kubectl && \
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_arm64.tar.gz" | tar xz -C /tmp && \
mv /tmp/eksctl /usr/local/bin && \
npm install -g typescript && \
npm install -g ts-node