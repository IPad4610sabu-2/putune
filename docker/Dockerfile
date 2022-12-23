#################################################################################
#                                  INSTALLERS                                   #
#   These images provide the dependencies required to build the other images.   #
#################################################################################

FROM quay.io/almalinuxorg/9-base AS builder-installer

# Needed for node 18+
# RUN dnf module --assumeyes enable nodejs

RUN --mount=type=cache,target=/var/cache/dnf \
    dnf install --assumeyes --nodocs nodejs ca-certificates jq make gcc g++

RUN npm install -g \
    npm@$(curl "https://release-monitoring.org/api/v2/versions/?project_id=190206" | jq --raw-output '.stable_versions[0]')


# Runtime dependencies
FROM quay.io/almalinuxorg/9-base AS installer

RUN --mount=type=cache,target=/var/cache/dnf \
    dnf install --assumeyes \
    --installroot /rpms \
    --releasever=9 \
    --setopt=install_weak_deps=false \
    --nodocs \
    nodejs ca-certificates

RUN dnf clean all \
    --installroot /rpms


# Proxy + certbot
FROM quay.io/almalinuxorg/9-base AS proxy-installer

RUN dnf install epel-release --assumeyes

RUN --mount=type=cache,target=/var/cache/dnf \
    dnf install --assumeyes \
    --installroot /rpms \
    --releasever=9 \
    --setopt=install_weak_deps=false \
    --nodocs \
    nginx-core certbot python3-certbot-nginx

RUN dnf clean all \
    --installroot /rpms

#################################################################################
#                                    BUILDER                                    #
#################################################################################

FROM builder-installer AS builder

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY . /usr/src/app
RUN npm install --frozen-lockile

#################################################################################                                     
#                                  FINAL IMAGE                                  #
#################################################################################

FROM quay.io/almalinuxorg/9-micro AS release-base

# Grab npm
COPY --from=installer /rpms /

# Grab site
COPY --from=builder /usr/src/app /app

WORKDIR /app

ENV NODE_ENV production


# Final image
FROM release-base as release
# EXPOSE 3000/tcp
ENTRYPOINT [ "node", "server.js" ]

# Final image with extras
FROM release AS release-aio
# Grab nginx and certbot
COPY --from=proxy-installer /rpms /

COPY docker/entrypoint.sh entrypoint.sh
RUN chmod +x entrypoint.sh
COPY docker/nginx.conf.example /etc/nginx/conf.d/poketube.conf

# EXPOSE 80/tcp
# EXPOSE 443/tcp
ENTRYPOINT [ "./entrypoint.sh" ]
CMD [ "node", "server.js" ]