"use client";

export default function AnimationProject2() {
  const scale = 0.4;
  const iframeWidth = 2000;
  const iframeHeight = 1030;

  return (
    <div style={{ 
      width: iframeWidth * scale,
      height: iframeHeight * scale,
    }}>
      <iframe
        src="/webgl/animation_project2/index.html"
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