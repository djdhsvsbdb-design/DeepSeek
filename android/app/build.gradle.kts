import org.gradle.api.tasks.Exec
import org.gradle.api.tasks.Sync

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

val repositoryRoot = rootProject.projectDir.parentFile

val buildWebFrontend by tasks.registering(Exec::class) {
    group = "deepseek"
    description = "Builds the existing React web client for the Android WebView."
    workingDir = repositoryRoot
    commandLine("pnpm", "--filter", "@deepseek-ai/dsh-web-frontend", "exec", "vite", "build", "--base=./")
}

val syncWebAssets by tasks.registering(Sync::class) {
    group = "deepseek"
    description = "Copies the built web client into Android application assets."
    dependsOn(buildWebFrontend)
    from(repositoryRoot.resolve("apps/web/dist"))
    into(layout.buildDirectory.dir("generated/web-assets/web"))
}

android {
    namespace = "ai.deepseek.harness.android"
    compileSdk = 35

    defaultConfig {
        applicationId = "ai.deepseek.harness.android"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"
    }

    sourceSets["main"].assets.srcDir(layout.buildDirectory.dir("generated/web-assets"))

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.webkit:webkit:1.12.1")
}

tasks.named("preBuild").configure {
    dependsOn(syncWebAssets)
}
