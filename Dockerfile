FROM alpine:3.9 AS build-stage

COPY routing /leafrouting

RUN apk update && \
    apk add --no-cache \
        boost-dev \
        build-base \
        cmake \
        curl \
        git \
        ninja \
        openssl-dev \
        websocket++ \
        zlib-dev && \
    git clone https://github.com/Microsoft/cpprestsdk.git && \
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
    cd /leafrouting/external && \
    if [ "$(ls -A arlib)" ]; \
        then echo "Arlib found"; \
        else echo "Arlib missing, cloning" && git clone https://github.com/leonardoarcari/arlib ; \
    fi && \
    cd .. && \
    mkdir cmake-build && \
    cd cmake-build && \
    cmake .. && \
    make main && \
    cd /build && \
    mv /leafrouting/cmake-build/main main && \
    rm -rf /leafrouting && \
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

CMD ["./main"]
