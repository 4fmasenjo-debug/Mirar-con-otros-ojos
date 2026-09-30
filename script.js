const video = document.getElementById("video");

const activeMaskElements = new Map();


// ============================================================
// CARGAR MODELOS
// ============================================================

async function cargarModelos() {

    try {

        console.log("Cargando modelos...");

        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri("./models"),
            faceapi.nets.faceLandmark68Net.loadFromUri("./models"),
            faceapi.nets.ageGenderNet.loadFromUri("./models")
        ]);

        console.log("Modelos cargados correctamente.");

        iniciarDeteccion();

    } catch (error) {

        console.error("ERROR CARGANDO LOS MODELOS:", error);

    }
}


// ============================================================
// DETECCIÓN
// ============================================================

function iniciarDeteccion() {

    video.addEventListener("play", () => {

        console.log("Vídeo iniciado.");

        const canvas = faceapi.createCanvasFromMedia(video);

        document.body.appendChild(canvas);

        const displaySize = {
            width: video.width,
            height: video.height
        };

        faceapi.matchDimensions(canvas, displaySize);


        setInterval(async () => {

            try {

                const detections = await faceapi
                    .detectAllFaces(
                        video,
                        new faceapi.TinyFaceDetectorOptions()
                    )
                    .withFaceLandmarks()
                    .withAgeAndGender();


                const resizedDetections =
                    faceapi.resizeResults(
                        detections,
                        displaySize
                    );


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


                    // ====================================================
                    // ELEGIR IMAGEN SEGÚN GÉNERO
                    // ====================================================

                    if (gender === "male") {

                        imagePath = "./hombre.png";

                    } else if (gender === "female") {

                        imagePath = "./mujer.png";

                    }


                    // ====================================================
                    // CREAR MÁSCARA
                    // ====================================================

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

                        maskElement.style.height = "auto";

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


                    // ====================================================
                    // MOSTRAR / OCULTAR
                    // ====================================================

                    if (imagePath === "") {

                        maskElement.style.display =
                            "none";

                    } else {

                        maskElement.style.display =
                            "block";


                        if (
                            !maskElement.src.endsWith(
                                imagePath
                            )
                        ) {

                            maskElement.src =
                                imagePath;

                        }


                        // ====================================================
                        // POSICIÓN
                        // ====================================================

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
                            `${videoRect.left +
                              box.x -
                              offsetX}px`;

                        maskElement.style.top =
                            `${videoRect.top +
                              box.y +
                              offsetY}px`;
                    }

                });


                // ====================================================
                // ELIMINAR MÁSCARAS DE CARAS QUE YA NO EXISTEN
                // ====================================================

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

            } catch (error) {

                console.error(
                    "Error durante la detección:",
                    error
                );

            }

        }, 100);

    });
}


// ============================================================
// INICIAR
// ============================================================

cargarModelos();
