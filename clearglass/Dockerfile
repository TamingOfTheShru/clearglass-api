FROM node:10-alpine

# set all labels
# to view the value type >docker inspect 
LABEL version="1.0", name="clearglass", \
	environment="dev", \
	description="microserive for clearglass"

# install bash command for developement environment
# --no-cache: download package index on-the-fly, no need to cleanup afterwards
# --virtual: bundle packages, remove whole bundle at once, when done
RUN apk --no-cache --virtual build-dependencies add \
    python \
    make \
    g++ \
	&& apk update && apk add bash \
	&& npm install -g nodemon

# Create app directory
WORKDIR /opt/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY ["package*.json", "index.js", "./"]	

RUN npm install \
    && npm cache clean --force

EXPOSE 8080

# Start the app
CMD npm start