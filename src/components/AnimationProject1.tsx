"use client";

export default function AnimationProject1() {
  const scale = 0.4;
  const iframeWidth = 2000;
  const iframeHeight = 1030;

  return (
    <div style={{ 
      width: iframeWidth * scale,
      height: iframeHeight * scale,
    }}>
      <iframe
        src="/webgl/animation_project1/project1.html"
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