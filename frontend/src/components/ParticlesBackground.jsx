import React, { useEffect, useRef } from 'react';
import { useTheme } from '../contexts/theme.jsx';

const ParticlesBackground = () => {
  const canvasRef = useRef(null);
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const isGothic = theme === 'gothic';

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const particles = [];

    // ─── LIGHT: Nature elements ─────────────────────────────
    class NatureElement {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.18;
        this.vy = (Math.random() - 0.5) * 0.18;
        this.size = Math.random() * 18 + 10;
        this.type = Math.random();
        this.opacity = Math.random() * 0.25 + 0.18;
        this.palette = [
          'rgba(34,197,94,0.7)', 'rgba(139,233,168,0.5)',
          'rgba(253,224,71,0.35)', 'rgba(236,72,153,0.25)',
          'rgba(59,130,246,0.25)', 'rgba(168,85,247,0.22)',
          'rgba(251,191,36,0.22)', 'rgba(16,185,129,0.22)',
        ];
        this.color = this.palette[Math.floor(Math.random() * this.palette.length)];
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
          ctx.beginPath();
          ctx.ellipse(this.x, this.y, this.size * 0.6, this.size * 0.25, Math.PI / 4, 0, 2 * Math.PI);
          ctx.fillStyle = this.color;
          ctx.fill();
        } else if (this.type < 0.7) {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size * 0.35, 0, 2 * Math.PI);
          ctx.fillStyle = this.color;
          ctx.fill();
        } else {
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

    // ─── DARK: Magical particles ────────────────────────────
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

    // ─── GOTHIC: Blood drops + embers ───────────────────────
    class BloodDrop {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height * -0.3;
        this.vy = Math.random() * 0.3 + 0.15;
        this.vx = (Math.random() - 0.5) * 0.05;
        this.w = Math.random() * 2 + 1.5;
        this.h = Math.random() * 6 + 4;
        this.opacity = Math.random() * 0.2 + 0.15;
      }
      update() {
        this.y += this.vy;
        this.x += this.vx;
        if (this.y > canvas.height + 20) {
          this.y = -20;
          this.x = Math.random() * canvas.width;
        }
      }
      draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = '#8b0000';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.w, this.h, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    class Ember {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + Math.random() * 50;
        this.vy = -(Math.random() * 0.4 + 0.1);
        this.vx = (Math.random() - 0.5) * 0.3;
        this.size = Math.random() * 2 + 0.5;
        this.opacity = Math.random() * 0.2 + 0.1;
        this.glow = Math.random() > 0.5;
        this.color = this.glow ? '#ff4500' : '#cc3300';
        this.life = 0;
        this.maxLife = Math.random() * 400 + 200;
      }
      update() {
        this.y += this.vy;
        this.x += this.vx + Math.sin(this.life * 0.02) * 0.1;
        this.life++;
        if (this.life > this.maxLife || this.y < -20) {
          this.y = canvas.height + 10;
          this.x = Math.random() * canvas.width;
          this.life = 0;
        }
      }
      draw() {
        const fade = 1 - (this.life / this.maxLife);
        ctx.save();
        ctx.globalAlpha = this.opacity * fade;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        if (this.glow) {
          ctx.globalAlpha = this.opacity * fade * 0.3;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    // ─── Create particles based on theme ────────────────────
    if (isGothic) {
      for (let i = 0; i < 15; i++) particles.push(new BloodDrop());
      for (let i = 0; i < 25; i++) particles.push(new Ember());
    } else if (isLight) {
      for (let i = 0; i < 550; i++) particles.push(new NatureElement());
    } else {
      for (let i = 0; i < 120; i++) particles.push(new Particle());
    }

    // Gothic fog state
    let fogOffset = 0;

    // ─── Animation loop ─────────────────────────────────────
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.update();
        p.draw();
      });

      // Dark mode: connection lines
      if (!isLight && !isGothic) {
        particles.forEach((particle, i) => {
          particles.slice(i + 1).forEach(other => {
            const dx = particle.x - other.x;
            const dy = particle.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100) {
              ctx.save();
              ctx.globalAlpha = (100 - dist) / 100 * 0.1;
              ctx.strokeStyle = '#8b5cf6';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(other.x, other.y);
              ctx.stroke();
              ctx.restore();
            }
          });
        });
      }

      // Gothic: fog at the bottom
      if (isGothic) {
        fogOffset += 0.003;
        const fogH = canvas.height * 0.15;
        const fogY = canvas.height - fogH;
        const grad = ctx.createLinearGradient(0, fogY, 0, canvas.height);
        grad.addColorStop(0, 'rgba(139, 0, 0, 0)');
        grad.addColorStop(0.5, `rgba(139, 0, 0, ${0.03 + Math.sin(fogOffset) * 0.01})`);
        grad.addColorStop(1, `rgba(139, 0, 0, ${0.06 + Math.sin(fogOffset * 1.5) * 0.02})`);
        ctx.save();
        ctx.fillStyle = grad;
        ctx.fillRect(0, fogY, canvas.width, fogH);
        ctx.restore();
      }

      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animId);
    };
  }, [isLight, isGothic]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: 'transparent' }}
    />
  );
};

export default ParticlesBackground;
