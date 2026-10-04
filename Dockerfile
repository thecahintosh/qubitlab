FROM node:24-bookworm-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y \
       python3 \
       python3-pip \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install

COPY requirements.txt ./

RUN if [ -s requirements.txt ]; then \
      pip3 install \
      --break-system-packages \
      -r requirements.txt; \
    fi

COPY . .

ENV NODE_ENV=production
ENV PORT=8000

EXPOSE 8000

CMD ["node", "server.js"]