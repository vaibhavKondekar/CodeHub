import { useContext, useEffect, useRef } from "react";
import '../Styles/whiteBoard.css'
import { DataContext } from "../Components/DataContext";

const WhiteBoard = () => {
    const { currRoom, socket } = useContext(DataContext);
    const roomId = useRef(currRoom ? currRoom.roomid : "");
    const isWhiteBoardOpen = useRef(false);

    useEffect(() => {
        const root = document.querySelector("#root");
        const canvas = document.querySelector('#white-board canvas');
        
        if (!canvas) {
            console.warn("Canvas element not found");
            return;
        }
        
        // Force set the background color
        const whiteBoard = document.querySelector("#white-board");
        if (whiteBoard) {
            if (root.classList.contains("dark")) {
                whiteBoard.style.backgroundColor = "#1a202c";
                if (canvas) canvas.style.backgroundColor = "#1a202c";
            } else {
                whiteBoard.style.backgroundColor = "#ffffff";
                if (canvas) canvas.style.backgroundColor = "#ffffff";
            }
        }
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.warn("Canvas context not available");
            return;
        }
        
        // Configure canvas context for better drawing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Get the container dimensions instead of full window
        const container = document.querySelector('.whiteboard-container');
        const containerRect = container ? container.getBoundingClientRect() : null;
        const width = canvas.width = containerRect ? containerRect.width : 800;
        const height = canvas.height = containerRect ? containerRect.height : 600;
        
        let time = performance.now();

        let interval = 0;
        let colorInterval = 0;
        const triangle = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];
        const rectangle = [0, 0, 0, 0];
        const circle = [0, 0, 0, 0, 0];

        // Function to resize canvas to fit container
        const resizeCanvas = () => {
            const container = document.querySelector('.whiteboard-container');
            if (container && canvas) {
                const containerRect = container.getBoundingClientRect();
                canvas.width = containerRect.width;
                canvas.height = containerRect.height;
                
                // Reconfigure context after resize
                if (ctx) {
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.strokeStyle = data.color;
                    ctx.lineWidth = data.thickness;
                }
            }
        };

        // Add resize listener
        window.addEventListener('resize', resizeCanvas);


        const data = { color: root.classList.contains("dark") ? "white" : "black", thickness: 1, prevX: 0, prevY: 0, x: 0, y: 0 };
        
        // Set initial context properties
        if (ctx) {
            ctx.strokeStyle = data.color;
            ctx.lineWidth = data.thickness;
        }
        
        const colors = document.querySelectorAll(".colors .color");
        const sizes = document.querySelectorAll(".sizes .size");
        const eraser = document.querySelector("#eraser");
        const shapes = document.querySelectorAll(".shapes .shape");
        
        // Only add event listeners if elements exist
        if (colors.length > 0) {
            colors.forEach((color, index) => {
                color.addEventListener("click", () => {
                    clearInterval(colorInterval);
                    colors.forEach(color => color.classList.remove("active"));
                    color.classList.add("active");
                    if (sizes[data.thickness - 1]) {
                        sizes[data.thickness - 1].classList.add("active");
                    }
                    if (eraser) eraser.classList.remove("active");
                    if (index == colors.length - 1) {
                        changeContinuous();
                    } else {
                        data.color = getComputedStyle(color).getPropertyValue("--color");
                        if (data.color == "black" && root.classList.contains("dark")) { data.color = "white"; }
                        if (ctx) {
                            ctx.strokeStyle = data.color;
                            ctx.lineWidth = data.thickness;
                        }
                        changeColorShape();
                    }
                })
            })
        }

        if (sizes.length > 0) {
            sizes.forEach(size => {
                size.addEventListener("click", () => {
                    sizes.forEach(size => size.classList.remove("active"));
                    size.classList.add("active");
                    if (eraser) eraser.classList.remove("active");
                    if (data.color == "white") {
                        if (colors[0]) colors[0].classList.add("active");
                    } else {
                        colors.forEach(color => {
                            if (getComputedStyle(color).getPropertyValue("--color") == data.color) {
                                color.classList.add("active");
                            }
                        });
                    }
                    data.thickness = getComputedStyle(size).getPropertyValue("--width");
                    if (ctx) {
                        ctx.lineWidth = data.thickness;
                        ctx.strokeStyle = data.color;
                    }
                })
            })
        }

        function changeContinuous() {
            colorInterval = setInterval(() => {
                ctx.strokeStyle = `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`;
                data.color = ctx.strokeStyle;
            }, 300);
        }

        const clearScreenBtn = document.querySelector("#clearScreen");
        if (clearScreenBtn && ctx) {
            clearScreenBtn.addEventListener("click", () => {
                ctx.clearRect(0, 0, width, height);
            });
        }

        if (eraser && ctx) {
            eraser.addEventListener("click", () => {
                const newColor = document.querySelector(".room")?.style.getPropertyValue("--primary-background-color") || "#ffffff";
                ctx.strokeStyle = newColor;
                ctx.lineWidth = 20;
                eraser.classList.add("active");
                sizes.forEach(size => size.classList.remove("active"));
                colors.forEach(color => color.classList.remove("active"));
                shapes.forEach(shape => shape.classList.remove("active"));
                if (pen) pen.classList.remove("active");
                clearInterval(colorInterval);
            })
        }

        const pen = document.querySelector("#pen");

        if (pen && ctx) {
            pen.addEventListener("click", () => {
                ctx.lineWidth = data.thickness;
                ctx.strokeStyle = data.color;
                pen.classList.add("active");
                eraser.classList.remove("active");
                sizes.forEach(size => size.classList.remove("active"));
                colors.forEach(color => color.classList.remove("active"));
                shapes.forEach(shape => shape.classList.remove("active"));
                clearInterval(colorInterval);
            })
        }

        if (shapes.length > 0) {
            shapes.forEach(shape => {
                shape.addEventListener("click", () => {
                    shapes.forEach(shape => shape.classList.remove("active"));
                    shape.classList.add("active");
                    eraser.classList.remove("active");
                    if (pen) pen.classList.remove("active");
                    clearInterval(colorInterval);
                })
            })
        }

        // Function to get correct canvas coordinates
        function getCanvasCoordinates(e) {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY
            };
        }

        function changeColorShape() {
            const shapes = document.querySelectorAll(".shapes .shape, .shapes #pen");
            shapes.forEach(shape => {
                if (shape.classList.contains("active")) {
                    shape.style.color = data.color;
                    shape.style.borderColor = data.color;
                } else {
                    shape.style.color = root.classList.contains("dark") ? "white" : "black";
                    shape.style.borderColor = root.classList.contains("dark") ? "white" : "black";
                }
            })
        }

        function dragged(e) {
            if (performance.now() - time < 10) return;
            data.prevX = data.x;
            data.prevY = data.y;
            const coords = getCanvasCoordinates(e);
            data.x = coords.x;
            data.y = coords.y;
            time = performance.now();
        }

        function pressed(e) {
            const shape = Array.from(shapes).find(shape => shape.classList.contains("active"));
            const coords = getCanvasCoordinates(e);

            if (shape) {
                triangle[0].x = coords.x;
                triangle[1].y = coords.y;
                rectangle[0] = coords.x;
                rectangle[1] = coords.y;
                circle[0] = coords.x;
                circle[1] = coords.y;

                canvas.addEventListener("mouseup", (e2) => {
                    const endCoords = getCanvasCoordinates(e2);
                    drawShape(endCoords, shape);
                    if (shape.id == "triangle") {
                        drawTriangle()
                    } else if (shape.id == "rectangle") {
                        drawRectangle()
                    } else {
                        drawCircle();
                    }
                }, { once: true })

            } else {
                data.prevX = data.x = coords.x;
                data.prevY = data.y = coords.y;
                canvas.addEventListener('mousemove', dragged);
                canvas.addEventListener('mouseup', lifted);
                interval = setInterval(() => drawLine(), 10);
            }
        }

        function lifted() {
            if (Array.from(shapes).some(shape => shape.classList.contains("active"))) return;
            clearInterval(interval);
            canvas.removeEventListener('mousemove', dragged);
        }
        canvas.addEventListener('mousedown', pressed);

        function drawLine() {
            ctx.beginPath();
            ctx.moveTo(data.prevX, data.prevY)
            ctx.lineTo(data.x, data.y);
            ctx.stroke();
            socket.emit("drawData", { roomId: roomId.current, prevX: data.prevX, prevY: data.prevY, x: data.x, y: data.y, color: data.color, thickness: data.thickness, shape: eraser.classList.contains("active") ? "eraser" : "pen" });
        }

        function drawShape(coords, shape) {
            if (shape.id == "triangle") {
                triangle[0].y = coords.y;
                triangle[2].x = coords.x;
                triangle[2].y = coords.y;
                triangle[1].x = (triangle[0].x + triangle[2].x) / 2;
            }

            if (shape.id == "rectangle") {
                rectangle[2] = coords.x;
                rectangle[3] = coords.y;
            }

            if (shape.id == "circle") {
                circle[2] = (coords.x - circle[0]) / 2 + circle[0];
                circle[3] = (coords.y - circle[1]) / 2 + circle[1];
                circle[4] = Math.sqrt(Math.pow(coords.x - circle[2], 2) + Math.pow(coords.y - circle[3], 2));
            }
        }

        function drawTriangle() {
            ctx.fillStyle = data.color;
            ctx.lineWidth = data.thickness;
            ctx.beginPath();
            ctx.moveTo(triangle[0].x, triangle[0].y);
            ctx.lineTo(triangle[1].x, triangle[1].y);
            ctx.lineTo(triangle[2].x, triangle[2].y);
            ctx.lineTo(triangle[0].x, triangle[0].y);
            ctx.stroke();
            socket.emit("drawData", { triangle, color: data.color, thickness: data.thickness, shape: "triangle" });
        }

        function drawRectangle() {
            ctx.fillStyle = data.color;
            ctx.lineWidth = data.thickness;
            ctx.beginPath();
            ctx.rect(rectangle[0], rectangle[1], rectangle[2] - rectangle[0], rectangle[3] - rectangle[1]);
            ctx.stroke();
            socket.emit("drawData", { rectangle, color: data.color, thickness: data.thickness, shape: "rectangle" });
        }

        function drawCircle() {
            ctx.fillStyle = data.color;
            ctx.lineWidth = data.thickness;
            ctx.beginPath();
            ctx.arc(circle[2], circle[3], circle[4], 0, 2 * Math.PI);
            ctx.stroke();
            socket.emit("drawData", { x: circle[2], y: circle[3], radius: circle[4], color: data.color, thickness: data.thickness, shape: "circle" });
        }

        socket.on("drawData", (data) => {
            ctx.strokeStyle = data.color;
            ctx.lineWidth = data.thickness;
            if (data.shape === "triangle") {
                ctx.beginPath();
                ctx.moveTo(data.triangle[0].x, data.triangle[0].y);
                ctx.lineTo(data.triangle[1].x, data.triangle[1].y);
                ctx.lineTo(data.triangle[2].x, data.triangle[2].y);
                ctx.lineTo(data.triangle[0].x, data.triangle[0].y);
                ctx.stroke();
                return;
            }
            if (data.shape === "rectangle") {
                ctx.beginPath();
                ctx.rect(data.rectangle[0], data.rectangle[1], data.rectangle[2] - data.rectangle[0], data.rectangle[3] - data.rectangle[1]);
                ctx.stroke();
                return;
            }
            if (data.shape === "circle") {
                ctx.beginPath();
                ctx.arc(data.x, data.y, data.radius, 0, 2 * Math.PI);
                ctx.stroke();
                return;
            }
            if (data.shape === "eraser") {
                ctx.lineWidth = 20;
                ctx.strokeStyle = "#fff";
            }
            ctx.beginPath();
            ctx.moveTo(data.prevX, data.prevY)
            ctx.lineTo(data.x, data.y);
            ctx.stroke();
        });

        const whiteBoardBtn = document.querySelector(".change-component-btn .change-btn");
        if (whiteBoardBtn) {
            whiteBoardBtn.addEventListener("click", () => {
                const coreComponentsParent = document.querySelector(".core-components");
                if (coreComponentsParent) {
                    let topPosition = !isWhiteBoardOpen.current ? coreComponentsParent.scrollHeight : 0;
                    coreComponentsParent.scrollTo({ top: topPosition, behavior: "smooth" });
                    isWhiteBoardOpen.current = !isWhiteBoardOpen.current;
                    whiteBoardBtn.classList.toggle("whiteboard-open")
                }
            })
        }

        // Cleanup function
        return () => {
            window.removeEventListener('resize', resizeCanvas);
            // Remove other event listeners if they exist
            if (whiteBoardBtn) {
                whiteBoardBtn.removeEventListener("click", () => {});
            }
        };
    }, []);
    return (
        <div id="white-board" className="whiteboard-wrapper">
            <div className="toolbar">
                <div className="sizes">
                    <div className="size active" style={{ "--width": 1 }}></div>
                    <div className="size" style={{ "--width": 2 }}></div>
                    <div className="size" style={{ "--width": 3 }}></div>
                    <div className="size" style={{ "--width": 4 }}></div>
                </div>

                <div className="colors">
                    <div className="color active" style={{ "--color": "white" }}></div>
                    <div className="color" style={{ "--color": "blue" }}></div>
                    <div className="color" style={{ "--color": "green" }}></div>
                    <div className="color" style={{ "--color": "yellow" }}></div>
                    <div className="color" style={{ "--color": "red" }}></div>
                    <div
                        className="color"
                        style=
                        {{
                            "--color": "linear-gradient(90deg, rgba(255,0,0,1) 0%, rgba(255,255,0,1) 50%, rgba(0,255,0,1) 100%)"
                        }}

                    ></div>
                </div>

                <div className="extras">
                    <div id="eraser"></div>
                    <div id="clearScreen">Clear</div>
                    <div className="shapes">
                        <div id="pen" className="active">
                            <i className="fa-solid fa-pen"></i>
                        </div>
                        <div className="shape" id="circle">
                            <i className="far fa-circle"></i>
                        </div>
                        <div className="shape" id="rectangle">
                            <i className="fa-regular fa-square"></i>
                        </div>
                        <div className="shape" id="triangle" style={{ "transform": "rotate(-90deg)" }}>
                            <i className="fa-solid fa-play"></i>
                        </div>
                    </div>
                </div>

            </div>
            <canvas style={{ width: '100%', height: '100%' }}></canvas>
        </div >
    )
};

export default WhiteBoard;