#Building
`cmake-build-debug` directory is for building and debugging the project as a standard executable. `weights` and `ids` **must be manually added**.  

Standard Docker image (no AWS) can be built with
```
docker build --tag=leafroute .
docker run -p 1337:1337 -td leafroute
```

#Testing
Run cmake-build-debug/main or the Docker image and test with curl:
```
curl http://localhost:1337/getroutes?&s_lat=45.4667971&s_lon=9.1904984&e_lat=45.4783918&e_lon=9.224554764332705&reroute=false
 ```
#Status
- [x]cmake-build-debug method working  
- [x]docker standard method working  
- [ ]docker-lambda method missing

