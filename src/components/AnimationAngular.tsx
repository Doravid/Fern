"use client";

export default function AnimationAngular() {
  const scale = 0.4;
  const iframeWidth = 2000;
  const iframeHeight = 1030;

  return (
    <div style={{ 
      width: iframeWidth * scale,
      height: iframeHeight * scale,
    }}>
      <iframe
        src="/webgl/animation_angular/example.html"
        scrolling="no"
        style={{
          width: iframeWidth,
          height: iframeHeight,
          transformOrigin: "top left",
          transform: `scale(${scale})`,
        }}
      />
    </div>
  );
}