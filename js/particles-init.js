tsParticles.load("tsparticles", {
    background: {
      color: "#0a0a0a"
    },
    fullScreen: {
      enable: true,
      zIndex: -1
    },
    interactivity: {
      events: {
        onClick: { enable: true, mode: "push" },
        onHover: { enable: true, mode: "repulse" },
        resize: true
      },
      modes: {
        push: { quantity: 4 },
        repulse: { distance: 100, duration: 0.4 }
      }
    },
    particles: {
      color: { value: "#00ffd5" },
      links: {
        color: "#00ffd5",
        distance: 150,
        enable: true,
        opacity: 0.3,
        width: 1
      },
      collisions: { enable: true },
      move: {
        direction: "none",
        enable: true,
        outModes: { default: "bounce" },
        random: false,
        speed: 1,
        straight: false
      },
      number: {
        density: { enable: true, area: 800 },
        value: 50
      },
      opacity: { value: 0.5 },
      shape: { type: "circle" },
      size: { value: { min: 1, max: 4 } }
    },
    detectRetina: true
  });