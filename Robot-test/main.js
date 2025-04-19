const robot = document.querySelector('#robot');
const beamGroup = document.querySelector('#beam-group');
const beamShape = document.querySelector('#beam-shape');
const tracks = document.querySelectorAll('#robot-tracks path');
const objects = document.querySelectorAll('#objects .object');

// Додано: масив з triggerX
const undergroundObjects = [
  {
    element: document.querySelector("#object1"),
    triggerX: 0,
    shown: false
  },
  {
    element: document.querySelector("#object2"),
    triggerX: 180,
    shown: false
  },
  {
    element: document.querySelector("#object3"),
    triggerX: 580,
    shown: false
  },
  {
    element: document.querySelector("#object4"),
    triggerX: 820,
    shown: false
  },
];

let lastX = 100;
let trackOffset = 0;

function animateTracks(dx) {
  trackOffset += dx * 2;

  tracks.forEach((track, index) => {
    const offsetX = Math.sin((trackOffset + index * 5) * 0.1) * 5;
    track.setAttribute('transform', `translate(${offsetX}, 0)`);
  });
}

// 🔥 Нова функція для перевірки triggerX кожного підземного обʼєкта
function checkUndergroundObjects(lightX) {
  undergroundObjects.forEach(obj => {
    const distance = Math.abs(lightX - obj.triggerX);
    const dark = obj.element.querySelector('.state-dark');
    const alert = obj.element.querySelector('.state-alert');

    if (distance < 40 && !obj.shown) {
      // Показуємо
      dark.classList.add('hidden');
      alert.classList.remove('hidden');
      obj.shown = true;
    } else if (distance >= 300 && obj.shown) {
      // Ховаємо
      dark.classList.remove('hidden');
      alert.classList.add('hidden');
      obj.shown = false;
    }
  });
}

// 🛠️ Оновлена функція – тепер тут тільки координата для перевірки triggerX
function checkCollisions(mouseX) {
  checkUndergroundObjects(mouseX);
}

// 🎮 Анімація руху робота + виклик перевірки
document.querySelector('#robot-scene').addEventListener('mousemove', (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const dx = x - lastX;
  lastX = x;
  const robotX = x - 60;

  gsap.to(robot, {
    x: robotX,
    duration: 0.1,
    ease: 'power2.out'
  });

  animateTracks(dx);
  checkCollisions(x);
});

// 📦 Позиціонування обʼєктів при завантаженні
window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.object').forEach(obj => {
    const x = obj.getAttribute('data-x');
    const y = obj.getAttribute('data-y');
    obj.setAttribute('transform', `translate(${x}, ${y})`);
  });
});

// 💡 Анімація променя
gsap.to('#beam-group', {
  opacity: 0.6,
  duration: 1,
  repeat: -1,
  yoyo: true,
  ease: 'sine.inOut'
});
