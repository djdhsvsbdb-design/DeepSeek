#include <jni.h>
#include <cstdlib>
#include <string>
#include "node.h"

extern "C" JNIEXPORT jint JNICALL
Java_dev_dsh_mobile_MainActivity_startNode(JNIEnv* env, jobject /* thiz */, jstring scriptPath) {
    const char* path = env->GetStringUTFChars(scriptPath, nullptr);
    if (path == nullptr) return -1;
    std::string script(path);
    env->ReleaseStringUTFChars(scriptPath, path);

    setenv("NODE_MOBILE", "1", 1);
    setenv("TMPDIR", "/data/local/tmp", 0);
    setenv("HOME", "/data/local/tmp", 0);

    char arg0[] = "node";
    char* argv[] = {arg0, script.data(), nullptr};
    return node::Start(2, argv);
}
