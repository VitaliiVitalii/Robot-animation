const robot = document.querySelector('#robot');
const beamGroup = document.querySelector('#beam-group');
const beamShape = document.querySelector('#beam-shape');
const tracks = document.querySelectorAll('#robot-tracks path');
const objects = document.querySelectorAll('#objects .object');
const dustGroup = document.querySelector('#dust-group');
const leftWheel = document.querySelector('#left-wheel');
const rightWheel = document.querySelector('#right-wheel');

let SCENE_WIDTH = window.innerWidth;
const beamOffsetX = 500;
let robotSpeed = 300;

let goingRight = true;
let lastRobotX = 0;
let trackOffset = 0;

function animateManipulator() {
  const baseAmplitudeY = 2 + Math.random(); // вертикальне тремтіння
  const baseAmplitudeX = 1 + Math.random(); // горизонтальне тремтіння
  const baseRotation = 1 + Math.random();   // обертання

  const duration = 0.2 + Math.random() * 0.3;

  // Загальна група
  gsap.to('#manipulator-group', {
    y: `+=${baseAmplitudeY}`,
    x: `+=${baseAmplitudeX}`,
    rotation: `+=${baseRotation}`,
    duration: duration,
    yoyo: true,
    repeat: -1,
    ease: 'sine.inOut',
    transformOrigin: '50% 50%'
  });

  // Рука
  gsap.to('#manipulator-arm', {
    y: `+=${baseAmplitudeY * 1.2}`,
    x: `+=${baseAmplitudeX * 1.1}`,
    rotation: `+=${baseRotation * 1.2}`,
    duration: duration * 0.95,
    yoyo: true,
    repeat: -1,
    ease: 'sine.inOut',
    transformOrigin: '50% 0%'
  });

  // Гак
  gsap.to('#manipulator-hook', {
    y: `+=${baseAmplitudeY * 1.6}`,
    x: `+=${baseAmplitudeX * 1.3}`,
    rotation: `+=${baseRotation * 1.5}`,
    duration: duration * 0.9,
    yoyo: true,
    repeat: -1,
    ease: 'sine.inOut',
    transformOrigin: '50% 0%'
  });
}


// --- Оновлення при зміні розміру ---
window.addEventListener('resize', () => {
  SCENE_WIDTH = window.innerWidth;
});

// Відсоткові координати об'єктів (адаптивно)
const originalUndergroundObjects = [
  {
    element: document.querySelector("#object1"),
    baseXRight: 0,
    baseXLeft: 100,
    shown: false
  },
  {
    element: document.querySelector("#object2"),
    baseXRight: 180,
    baseXLeft: 300,
    shown: false
  },
  {
    element: document.querySelector("#object3"),
    baseXRight: 580,
    baseXLeft: 820,
    shown: false
  },
  {
    element: document.querySelector("#object4"),
    baseXRight: 820,
    baseXLeft: 0,
    shown: false
  },
];

// Отримання координат активних об'єктів з урахуванням напрямку
function getCurrentTriggerXs() {
  return originalUndergroundObjects.map(obj => {
    return {
      ...obj,
      triggerX: goingRight ? obj.baseXRight : obj.baseXLeft
    };
  });
}

function animateTracks(dx) {
  trackOffset += dx * 2;
  tracks.forEach((track, index) => {
    const offsetX = Math.sin((trackOffset + index * 5) * 0.1) * 5;
    track.setAttribute('transform', `translate(${offsetX}, 0)`);
  });
}

function checkUndergroundObjects(lightX, activeObjs) {
  activeObjs.forEach(obj => {
    const distance = Math.abs(lightX - obj.triggerX);
    const dark = obj.element.querySelector('.state-dark');
    const alert = obj.element.querySelector('.state-alert');

    if (distance < 40 && !obj.shown) {
      dark.classList.add('hidden');
      alert.classList.remove('hidden');
      obj.shown = true;
    } else if (distance >= 300 && obj.shown) {
      dark.classList.remove('hidden');
      alert.classList.add('hidden');
      obj.shown = false;
    }
  });
}

function checkCollisions(x, activeObjs) {
  checkUndergroundObjects(x, activeObjs);
}

// --- Пилюка ---
function spawnDust(x, y) {
  const svg = document.querySelector('svg');
  const numParticles = 5;

  // Динамічний зсув групи пилюки
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const offsetX = goingRight ? -400 : 400;
  group.setAttribute("transform", `translate(${offsetX}, -50)`);
  svg.appendChild(group);

  for (let i = 0; i < numParticles; i++) {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");

    const colors = ["#444", "#555", "#333", "#666", "#2b2b2b"];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const radius = 2.5 + Math.random() * 2;
    const offsetX = (Math.random() - 0.5) * 30;
    const offsetY = Math.random() * -10;

    const startX = x + offsetX;
    const startY = y + offsetY;

    circle.setAttribute("r", radius.toFixed(1));
    circle.setAttribute("fill", color);
    circle.setAttribute("opacity", "0.7");
    circle.setAttribute("cx", startX);
    circle.setAttribute("cy", startY);

    group.appendChild(circle);

    gsap.to(circle, {
      cx: startX + (Math.random() - 0.5) * 20,
      cy: startY - (Math.random() * 20 + 10),
      opacity: 0,
      scale: 1.5,
      duration: 1.2 + Math.random() * 0.4,
      ease: "power1.out",
      onComplete: () => {
        circle.remove();
        if (group.childNodes.length === 0) group.remove();
      }
    });
  }
}






function moveRobot() {
  const activeObjects = getCurrentTriggerXs();
  const fromX = goingRight ? -beamOffsetX : SCENE_WIDTH + beamOffsetX;
  const toX = goingRight ? SCENE_WIDTH + beamOffsetX : -beamOffsetX;
  const distance = Math.abs(toX - fromX);
  const duration = distance / robotSpeed;
  const groundY = window.innerHeight * 0.65;

  gsap.set(robot, {
    x: fromX,
    y: groundY,
    xPercent: -50,
    autoAlpha: 1,
    scaleX: goingRight ? 1 : -1,
    transformOrigin: "center center"
  });

  gsap.to(robot, {
    x: toX,
    duration: duration,
    ease: 'none',
    onUpdate: function () {
      const currentX = gsap.getProperty(robot, 'x');
      const dx = currentX - lastRobotX;

      animateTracks(dx);

      // 🔄 Обертання коліс
      const wheelRadius = 40; // Згідно з SVG
      const wheelCircumference = 2 * Math.PI * wheelRadius;
      const rotationDelta = (dx / wheelCircumference) * 360;

      // Враховуємо напрямок
      const direction = goingRight ? 1 : -1;
      const currentRotation = gsap.getProperty(leftWheel, "rotation") || 0;
      const newRotation = currentRotation + rotationDelta * direction;

      gsap.set(leftWheel, {
        rotation: newRotation,
        transformOrigin: "50% 50%"
      });

      gsap.set(rightWheel, {
        rotation: newRotation,
        transformOrigin: "50% 50%"
      });

      // 💨 Пилюка
      if (Math.random() < 0.1) {
        const dustX = currentX + (goingRight ? -50 : 50);
        const dustY = groundY + 20;
        spawnDust(dustX, dustY);
      }

      // 👀 Виявлення об’єктів
      checkCollisions(currentX, activeObjects);

      lastRobotX = currentX;
    },
    onComplete: () => {
      gsap.to(robot, {
        autoAlpha: 0,
        duration: 0.5,
        onComplete: () => {
          goingRight = !goingRight;
          setTimeout(() => {
            lastRobotX = goingRight ? -beamOffsetX : SCENE_WIDTH + beamOffsetX;
            moveRobot();
          }, 100);
        }
      });
    }
  });
}


// Початкове позиціонування підземних об'єктів
window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.object').forEach(obj => {
    const x = obj.getAttribute('data-x');
    const y = obj.getAttribute('data-y');
    obj.setAttribute('transform', `translate(${x}, ${y})`);
  });

  moveRobot();
  animateManipulator();
});

// Промінь: анімація пульсації та блюру
gsap.to('#beam-group', {
  opacity: 0.6,
  duration: 1.5,
  repeat: -1,
  yoyo: true,
  ease: 'sine.inOut'
});

gsap.to('#beam-shape', {
  scale: 1.04,
  duration: 1.2,
  repeat: -1,
  yoyo: true,
  transformOrigin: 'center center',
  ease: 'sine.inOut'
});
