/**
 * Fitzie Web Store - Confetti Micro-Library
 * A high-performance canvas-based confetti particle system in pure ES6.
 */

window.fitzieConfetti = {
  start: function(durationMs = 3000) {
    // Check if canvas already exists
    if (document.getElementById('confetti-canvas')) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '99999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Handle resize
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const colors = [
      '#dc2626', // Bold Red
      '#9ca3af', // Cool Grey
      '#ffffff', // White
      '#ef4444', // Bright Red
      '#6b7280'  // Mid Grey
    ];

    const particles = [];
    const particleCount = 150;

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * -height - 20;
        this.size = Math.random() * 8 + 4;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.speedX = Math.random() * 4 - 2;
        this.speedY = Math.random() * 5 + 3;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 4 - 2;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.rotation += this.rotationSpeed;

        // Reset if off screen
        if (this.y > height) {
          this.y = -20;
          this.x = Math.random() * width;
        }
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.fillStyle = this.color;
        
        // Randomly draw squares or circles
        if (Math.random() > 0.5) {
          ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();
      }
    }

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    let animationFrameId;
    let isActive = true;

    // Animation loop
    const animate = () => {
      if (!isActive) return;
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup after duration
    setTimeout(() => {
      isActive = false;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      
      // Fade out canvas
      canvas.style.transition = 'opacity 1s ease';
      canvas.style.opacity = '0';
      
      setTimeout(() => {
        if (canvas.parentNode) {
          canvas.parentNode.removeChild(canvas);
        }
      }, 1000);
    }, durationMs);
  }
};
