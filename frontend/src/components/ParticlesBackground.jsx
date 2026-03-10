import React, { useEffect, useRef } from 'react';
import { useTheme } from '../contexts/theme.jsx';

const ParticlesBackground = () => {
  const canvasRef = useRef(null);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Configurar canvas para tela cheia
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Configurações
    const particles = [];
    const particleCount = isLight ? 550 : 120;

    // --- CLASSES ---
    class NatureElement {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.18;
        this.vy = (Math.random() - 0.5) * 0.18;
        this.size = Math.random() * 18 + 10;
        this.type = Math.random();
        this.opacity = Math.random() * 0.25 + 0.18;
        // Paleta de cores suaves para natureza
        this.palette = [
          'rgba(34,197,94,0.7)',      // verde folha
          'rgba(139,233,168,0.5)',   // verde claro
          'rgba(253,224,71,0.35)',   // amarelo
          'rgba(236,72,153,0.25)',   // rosa
          'rgba(59,130,246,0.25)',   // azul claro
          'rgba(168,85,247,0.22)',   // lavanda
          'rgba(251,191,36,0.22)',   // amarelo quente
          'rgba(16,185,129,0.22)',   // verde esmeralda
        ];
        this.color = this.palette[Math.floor(Math.random() * this.palette.length)];
        // Para flores, pétalas e centro também terão cor aleatória
        this.flowerPetal = this.palette[Math.floor(Math.random() * this.palette.length)];
        this.flowerCenter = this.palette[Math.floor(Math.random() * this.palette.length)];
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        this.x = Math.max(0, Math.min(canvas.width, this.x));
        this.y = Math.max(0, Math.min(canvas.height, this.y));
      }
      draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        if (this.type < 0.4) {
          // Folha
          ctx.beginPath();
          ctx.ellipse(this.x, this.y, this.size * 0.6, this.size * 0.25, Math.PI / 4, 0, 2 * Math.PI);
          ctx.fillStyle = this.color;
          ctx.fill();
        } else if (this.type < 0.7) {
          // Bolha
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size * 0.35, 0, 2 * Math.PI);
          ctx.fillStyle = this.color;
          ctx.fill();
        } else {
          // Flor
          for (let i = 0; i < 6; i++) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate((Math.PI * 2 * i) / 6);
            ctx.beginPath();
            ctx.ellipse(0, this.size * 0.18, this.size * 0.18, this.size * 0.08, 0, 0, 2 * Math.PI);
            ctx.fillStyle = this.flowerPetal;
            ctx.fill();
            ctx.restore();
          }
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size * 0.09, 0, 2 * Math.PI);
          ctx.fillStyle = this.flowerCenter;
          ctx.fill();
        }
        ctx.restore();
      }
    }

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 2 + 1;
        this.opacity = Math.random() * 0.5 + 0.2;
        this.color = `hsl(${Math.random() * 60 + 250}, 70%, 60%)`;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        this.x = Math.max(0, Math.min(canvas.width, this.x));
        this.y = Math.max(0, Math.min(canvas.height, this.y));
      }
      draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // --- CRIAÇÃO ---
    for (let i = 0; i < particleCount; i++) {
      if (isLight) {
        particles.push(new NatureElement());
      } else {
        particles.push(new Particle());
      }
    }

    // --- ANIMAÇÃO ---
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      // Conexões só no dark
      if (!isLight) {
        particles.forEach((particle, i) => {
          particles.slice(i + 1).forEach(otherParticle => {
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 100) {
              ctx.save();
              ctx.globalAlpha = (100 - distance) / 100 * 0.1;
              ctx.strokeStyle = '#8b5cf6';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              ctx.stroke();
              ctx.restore();
            }
          });
        });
      }
      requestAnimationFrame(animate);
    };
    animate();
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isLight]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: 'transparent' }}
    />
  );
};

export default ParticlesBackground; 