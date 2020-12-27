# clearglass

Clearglass API services

This is Dockerized API service for clearglass.

Steps to run:

1. Clone the project.
2. cd into the project folder "clearglass-api"
3. In one terminal window, run "make database cmd=up"
4. Open another terminal windoe, and run "make clearglas-api cmd=build" (only once), then run "make clearglass-api cmd=up"
5. To stop the containers, run "make clearglass-api cmd=down", "make clearglass-api cmd=down" in the respective window.

Once containers are up, import the dumps file from the location "/clearglass-api/clearglass/src/dumps", to the database using TablePlus (or any other supported database GUI), using the File->Import feature.  

