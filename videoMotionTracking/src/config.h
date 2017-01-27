#pragma once

#include <string>
#include <unordered_map>
#include <opencv2/core.hpp>

// See ../config.yml for an example config file to parse by this code.

struct CameraClass {
    std::string name;
    std::string username;
    std::string password;
    std::string path;
};

struct CameraInfo {
    int id;
    std::string name;
    std::string description;
    std::string className;
    std::string ip;
    cv::Rect crop;
};

class Config {
public:

    Config(std::string filename);

    std::string getServerURL();
    int getServerPort();

    bool isCameraDefined(int id);
    CameraInfo getCameraInfo(int id);

    CameraClass getCameraClassInfo(std::string name);
    CameraClass getCameraClassInfo(int camId);

private:

    cv::FileStorage file;
    std::unordered_map<int, CameraInfo> cameras;
};
