// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "CatDogKill",
    platforms: [
        .iOS(.v16),
        .macOS(.v13)
    ],
    products: [
        .library(
            name: "CatDogKill",
            targets: ["CatDogKill"]
        ),
    ],
    dependencies: [
        .package(url: "https://github.com/daltoniam/Starscream.git", from: "4.0.0"),
    ],
    targets: [
        .target(
            name: "CatDogKill",
            dependencies: [
                .product(name: "Starscream", package: "Starscream")
            ],
            path: "CatDogKill"
        ),
        .testTarget(
            name: "CatDogKillTests",
            dependencies: ["CatDogKill"]
        ),
    ]
)
