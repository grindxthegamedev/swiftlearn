class InteractiveGrid {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.className = 'interactive-grid';
        
        // Grid properties
        this.gridSize = 30;
        this.dotSize = 1;
        this.mouseRadius = 100;
        this.maxExtrusion = 15;
        this.mousePos = { x: -1000, y: -1000 }; // Start mouse off-screen
        this.baseOpacity = 0.3; // Base opacity for all dots
        this.hoverOpacity = 0.5; // Max opacity when mouse is near
        
        // Initialize
        this.init();
        this.addEventListeners();
        this.animate();
    }

    init() {
        document.body.appendChild(this.canvas);
        this.resize();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.cols = Math.floor(this.canvas.width / this.gridSize) + 2;
        this.rows = Math.floor(this.canvas.height / this.gridSize) + 2;
    }

    addEventListeners() {
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => {
            this.mousePos = {
                x: e.clientX,
                y: e.clientY
            };
        });
    }

    drawGrid() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let i = 0; i < this.cols; i++) {
            for (let j = 0; j < this.rows; j++) {
                const x = i * this.gridSize;
                const y = j * this.gridSize;
                
                // Calculate distance from mouse
                const dx = x - this.mousePos.x;
                const dy = y - this.mousePos.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Calculate extrusion and opacity based on mouse distance
                const extrusion = Math.max(0, 1 - distance / this.mouseRadius) * this.maxExtrusion;
                const hoverEffect = Math.max(0, 1 - distance / this.mouseRadius);
                
                // Blend between base opacity and hover opacity
                const opacity = this.baseOpacity + (this.hoverOpacity - this.baseOpacity) * hoverEffect;
                
                // Draw dot with extrusion effect
                this.ctx.beginPath();
                this.ctx.fillStyle = `rgba(141, 0, 202, ${opacity})`;
                this.ctx.arc(
                    x + (dx / distance) * extrusion || x,
                    y + (dy / distance) * extrusion || y,
                    this.dotSize + extrusion * 0.3,
                    0,
                    Math.PI * 2
                );
                this.ctx.fill();
            }
        }
    }

    animate() {
        this.drawGrid();
        requestAnimationFrame(() => this.animate());
    }
} 