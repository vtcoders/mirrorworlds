#include <cstdlib>
#include <string>
#include <memory>
#include <iostream>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <opencv2/core.hpp>
#include <opencv2/highgui.hpp>
#include "config.h"
#include "camera.h"
#include "display.h"
#include "track.h"
#include "objecttracker.h"
#include "trackers/difference.h"
#include "Networking/blob.h"
#include "Networking/blobSender.h"
#include <opencv2/calib3d.hpp>



static
void sendTracks(int cameraId, cv::Size imgSize, ObjectTracker* tracker, blobSender& sender) {
    Blob blobData;
    memset(&blobData, 0, sizeof(blobData));
    blobData.cameraID = cameraId;

    // Send deleted blobs first
    for(int id : tracker->getDeletedTracks()) {
        blobData.id = id;
        sender.sendRemoveBlob(&blobData);
    }

    // Then send new/updated blobs
    for(const std::unique_ptr<Track>& track : tracker->getTracks()) {
        blobData.id = track->getId();
        const cv::Rect& bbox = track->getBBox();
        blobData.bounding_x = bbox.x;
        blobData.bounding_y = bbox.y;
        blobData.bounding_width = bbox.width;
        blobData.bounding_height = bbox.height;
        blobData.origin_x = bbox.x + (bbox.width * 0.5);
        blobData.origin_y = bbox.y + (bbox.height * 0.5);
        blobData.area = cv::contourArea(track->getContour());

        blobData.image_width = imgSize.width;
        blobData.image_height = imgSize.height;

        if(track->getAge() == 1) {
            sender.sendNewBlob(&blobData);
        } else {
            sender.sendUpdateBlob(&blobData);
        }
    }
}

// TODO: this awful interface is compatible with the old
// Usage: PROG <id> [path]
// except the 2 args may be added [server port]
// TODO: So this needs to be made a little cleaner.
static
int usage(std::string progName) {
    std::cout << "Usage: " << progName << " <id> [path [server port]]" << std::endl
        << std::endl
        << "Where [path] is optional and can be an IP address, a URL, or a video file." << std::endl
        << "If [path] is an IP address, the correct URL will be guessed based on the camera ID." << std::endl
        << "If [path] is omitted, camera parameters will be read from the configuration file." << std::endl;
    return 1;
}


static
Config *config;


static
std::string parseURL(int camId, std::string arg) {
    in_addr ipaddr;
    if(inet_pton(AF_INET, arg.c_str(), &ipaddr) == 1) {
        if(config->isCameraDefined(camId)) {
            CameraInfo camInfo = config->getCameraInfo(camId);
            CameraClass classInfo = config->getCameraClassInfo(camInfo.className);
            std::cout << "Using camera " << camId << " (" << camInfo.description << ")" << std::endl;
            std::string url("http://");
            url += classInfo.username + ":" + classInfo.password + "@";
            url += arg + "/" + classInfo.path;
            return url;
        } else {
            std::cout << "Using camera at address " << arg << std::endl;
            return std::string("http://admin:admin@") + arg + std::string("/video.cgi?.mjpg");
        }
    } else {
        std::cout << "Using file/URL " << arg << std::endl;
        return arg;
    }
}

static
std::string getURL(int camId) {
    CameraInfo camInfo = config->getCameraInfo(camId);
    //cout << __FILE__ << ":" << __LINE__ << std::endl;
    return parseURL(camId, camInfo.ip);
}


int main(int argc, char *argv[]) {

    try {
        config = new Config("config.yml");
    } catch(const std::string filename) {
        std::cerr << "Failed to open config file: " << filename << std::endl;
        return 1;
    }

    std::string serverURL = config->getServerURL();
    int serverPort = config->getServerPort();
    cv::Rect crop(0,0,0,0); // not cropped, height=0, by default 

    int id;
    std::string url;
    // Parse arguments
    if(argc == 1) {
        // Defaults
        std::cout << "Using default video input" << std::endl;
        id = 0;
        url = "../walk-cut.mov"; // TODO: this will fail
    } else if(
            (argc == 2 && std::string(argv[1]) == "--help") ||
            (argc > 5) || // argc == 5 is valid
            (argc == 4)
            ) {
        return usage(argv[0]);
    } else if(argc == 2) {
        id = std::atoi(argv[1]);
        url = getURL(id);
    } else {
        id = std::atoi(argv[1]);
        url = parseURL(id, argv[2]);
    }

    if(config->isCameraDefined(id))
        // Get the camera crop
        crop = config->getCameraInfo(id).crop;

    delete config; // We are done with config.

    // Initialize system objects
    blobSender sender(
            (argc==5) ? argv[3] : serverURL.c_str(),
            (argc==5) ? std::atoi(argv[4]) : serverPort
            ); // set up networking
    Camera camera(url, crop);
    Display display("camera " + std::to_string(id));
    ObjectTracker* tracker = new DifferenceTracker();

    // Start video processing
    try {
        cv::UMat frame;
        while(camera.getFrame(frame)) {
            tracker->processFrame(frame);
            display.showFrame(frame, tracker->getMaskImage(), tracker->getTracks());
            sendTracks(id, {frame.cols, frame.rows}, tracker, sender);
            // Only the least-signficant byte is used, sometimes the rest is garbage so 0xFF is needed
            int key = cv::waitKey(10) & 0xFF;
            if(key == 27) { // Escape pressed
                break;
            }
        }
    } catch(const std::exception& ex) {
        std::cerr << "Error occurred: " << ex.what() << std::endl;
        return 1;
    }
    return 0;
}
