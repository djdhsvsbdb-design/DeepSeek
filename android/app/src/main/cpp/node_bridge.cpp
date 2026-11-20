#include <jni.h>
#include <cstdlib>
#include <string>
#include "node.h"

extern "C" JNIEXPORT jint JNICALL
Java_dev_dsh_mobile_MainActivity_startNode(JNIEnv* env, jobject /* thiz */,
        jstring scriptPath, jstring homePath, jstring tempPath) {
    const char* scriptRaw = env->GetStringUTFChars(scriptPath, nullptr);
    const char* homeRaw = env->GetStringUTFChars(homePath, nullptr);
    const char* tempRaw = env->GetStringUTFChars(tempPath, nullptr);
    if (!scriptRaw || !homeRaw || !tempRaw) return -1;
    std::string script(scriptRaw), home(homeRaw), temp(tempRaw);
    env->ReleaseStringUTFChars(scriptPath, scriptRaw);
    env->ReleaseStringUTFChars(homePath, homeRaw);
    env->ReleaseStringUTFChars(tempPath, tempRaw);

    setenv("NODE_MOBILE", "1", 1);
    setenv("HOME", home.c_str(), 1);
    setenv("TMPDIR", temp.c_str(), 1);
    setenv("NODE_COMPILE_CACHE", (temp + "/node-compile-cache").c_str(), 1);
    setenv("NODE_COMPILE_CACHE_PORTABLE", "1", 1);

    char arg0[] = "node";
    char* argv[] = {arg0, script.data(), nullptr};
    return node::Start(2, argv);
}
