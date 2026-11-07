# Dev-only image: bun + node + git. Dependencies are installed at container start
# into named volumes, so the host never sees a node_modules directory.
FROM node:22-bookworm-slim

# Reuse the bun binary from the official image instead of a curl|sh install.
COPY --from=oven/bun:1.4.3 /usr/local/bin/bun /usr/local/bin/bun

RUN apt-get update \
 && apt-get install -y --no-install-recommends git ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Match the host uid/gid so bind-mounted files stay owned by you.
ARG UID=1001
ARG GID=1001
RUN groupadd -g "$GID" app \
 && useradd -m -u "$UID" -g "$GID" -s /bin/bash app

# Pre-create every path that gets a named volume, owned by app. Docker seeds a
# fresh volume's ownership from the image's directory, so without this each new
# volume mounts root-owned and `bun install` fails with EACCES.
RUN mkdir -p /workspace/node_modules \
             /workspace/packages/api/node_modules \
             /workspace/apps/admin/node_modules \
             /workspace/apps/vendor/node_modules \
             /workspace/apps/storefront/node_modules \
             /workspace/apps/storefront-koi/node_modules \
             /home/app/.bun/install/cache \
 && chown -R "$UID:$GID" /workspace /home/app

USER app
ENV HOME=/home/app
WORKDIR /workspace

CMD ["bun", "run", "dev"]
