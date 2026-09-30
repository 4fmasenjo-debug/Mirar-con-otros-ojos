const video = document.getElementById("video");
const activeMaskElements = new Map();
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri("./models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("./models"),
    faceapi.nets.ageGenderNet.loadFromUri("./models")
])
.then(() => {
    console.log("MODELOS CARGADOS CORRECTAMENTE");
    video.addEventListener("play", () => {
        const canvas = faceapi.createCanvasFromMedia(video);
        document.body.appendChild(canvas);
        const displaySize = {
            width: video.width,
            height: video.height
        };
        faceapi.matchDimensions(canvas, displaySize);
        setInterval(async () => {
            const detections = await faceapi
                .detectAllFaces(
                    video,
                    new faceapi.TinyFaceDetectorOptions()
                )
                .withFaceLandmarks()
                .withAgeAndGender();
            const resizedDetections =
                faceapi.resizeResults(detections, displaySize);
            const ctx = canvas.getContext("2d");
            ctx.clearRect(
                0,
                0,
                canvas.width,
                canvas.height
            );
            const currentFaceIndices = new Set();
            resizedDetections.forEach((detection, index) => {
                currentFaceIndices.add(index);
                const gender = detection.gender;
                let imagePath = "";
                if (gender === "male") {
                    imagePath = "hombre.png";
                }
                if (gender === "female") {
                    imagePath = "mujer.png";
                }
                let maskElement =
                    activeMaskElements.get(index);
                if (!maskElement) {
                    maskElement =
                        document.createElement("img");
                    maskElement.className =
                        "emotion-mask";
                    maskElement.style.position =
                        "absolute";
                    maskElement.style.zIndex = "10";
                    maskElement.style.pointerEvents =
                        "none";
                    document.body.appendChild(
                        maskElement
                    );
                    activeMaskElements.set(
                        index,
                        maskElement
                    );
                }
                if (imagePath === "") {
                    maskElement.style.display =
                        "none";
                } else {
                    maskElement.style.display =
                        "block";
                    if (
                        maskElement.getAttribute("src")
                        !== imagePath
                    ) {
                        maskElement.src =
                            imagePath;
                    }
                    const box =
                        detection.detection.box;
                    const videoRect =
                        video.getBoundingClientRect();
                    const scaleFactor = 1.3;
                    const offsetX =
                        (box.width *
                        (scaleFactor - 1)) / 2;
                    const offsetY =
                        box.height * -0.25;
                    maskElement.style.width =
                        `${box.width * scaleFactor}px`;
                    maskElement.style.left =
                        `${videoRect.left + box.x - offsetX}px`;
                    maskElement.style.top =
                        `${videoRect.top + box.y + offsetY}px`;
                }
            });
            activeMaskElements.forEach(
                (maskElement, index) => {
                    if (
                        !currentFaceIndices.has(index)
                    ) {
                        maskElement.remove();
                        activeMaskElements.delete(
                            index
                        );
                    }
                }
            );

        }, 100);
    });
})
.catch(error => {
    console.error(
        "ERROR CARGANDO MODELOS:",
        error
    );
});
