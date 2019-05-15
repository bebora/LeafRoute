FROM alpine:3.9

COPY routing /leafrouting

RUN apk update && \
    apk add --no-cache \
        boost-dev \
        build-base\ 
        git \
        cmake \
        curl \
        ninja \
        openssl \
        openssl-dev \
        zlib-dev && \
    git clone --recurse-submodules https://github.com/Microsoft/cpprestsdk.git && \
    cd cpprestsdk && \
    mkdir build-cpprestsdk && \
    cd build-cpprestsdk && \
    cmake -G Ninja .. -DCMAKE_BUILD_TYPE=Debug && \
    ninja && \
    ninja install && \
    cd ../.. && \
    rm -rf cpprestsdk && \
    mkdir build && \
    cd /leafrouting/external && \
    if [ "$(ls -A arlib)" ]; then echo "Arlib found"; else echo "Arlib missing, cloning" && git clone https://github.com/leonardoarcari/arlib ; fi && \
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

EXPOSE 1337

WORKDIR /build

CMD ["./main"]