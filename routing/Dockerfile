# https://docs.docker.com/develop/develop-images/dockerfile_best-practices/

FROM alpine:3.9 AS build-stage

RUN apk update && \
    apk add --no-cache \
        boost-dev \
        build-base \
        cmake \
        curl \
        curl-dev \
        git \
        libexecinfo-dev \
        ninja \
        openssl-dev \
        websocket++ \
        zlib-dev
        
RUN git clone https://github.com/Microsoft/cpprestsdk.git && \
    cd cpprestsdk && \
    mkdir build-cpprestsdk && \
    cd build-cpprestsdk && \
    cmake -G Ninja .. \
        -DCMAKE_BUILD_TYPE=Release \
        -DBUILD_TESTS=OFF \
        -DBUILD_SAMPLES=OFF && \ 
    ninja && \
    ninja install && \
    cd ../.. && \
    rm -rf cpprestsdk && \
    mkdir build && \
    git clone https://github.com/awslabs/aws-lambda-cpp /tmp/aws-lambda-cpp && \
    cd /tmp/aws-lambda-cpp && \
    mkdir build && \
    cd build && \
    cmake .. \
        -DCMAKE_BUILD_TYPE=Release \
        -DCMAKE_INSTALL_PREFIX=/usr && \
    make && make install
    
COPY . /leafrouting

RUN cd /leafrouting/routesfetcher/external && \
    if [ "$(ls -A arlib)" ]; \
        then echo "Arlib found"; \
        else echo "Arlib missing, cloning" && git clone https://github.com/leonardoarcari/arlib ; \
    fi && \
    if [ "$(ls -A json11)" ]; \
            then echo "json11 found"; \
            else echo "json11 missing, cloning" && git clone https://github.com/dropbox/json11 ; \
    fi && \
    cd ../.. && \
    mkdir build-main && \
    cd build-main && \
    cmake .. && \
    make cppserver && \
    mv /leafrouting/build-main/cpprestsdk/cppserver /build/cppserver && \
    rm -rf /leafrouting && \
    cd /build && \
    curl https://leafroute.tk/ids -o ids && \
    curl https://leafroute.tk/weights -o weights

FROM alpine:3.9 AS deploy-stage

# Copy main and map files from previous image
COPY --from=build-stage /build /leafroute-built

# Copy cpprestsdk.so from previous image
COPY --from=build-stage /usr/local/lib64/ /usr/local/lib64/

RUN apk update && \
    apk add --no-cache boost-system boost-program_options libstdc++

EXPOSE 1337

WORKDIR /leafroute-built

CMD ["./cppserver"]
