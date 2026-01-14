import liloStitchFrameB from "../assets/images/frames/lilo_stitch_frames/lilo_stitch_frame_b.png";
import internDayFrameB from "../assets/images/frames/intern_day_frames/intern_day_frame_b.png";
//! Photo Strip Preview Constants Start

// Frame overlay options
export const frameOptions = [
  {
    id: null,
    name: "No Frame",
    supportedLayouts: ["a", "b", "c", "d"],
    imagePath: null,
  },
  {
    id: "lilo_stitch",
    name: "Lilo & Stitch",
    supportedLayouts: ["b"], // Only layout B is supported
    imagePath: liloStitchFrameB,
  },
  /*     {
      id: "christmas_party",
      name: "Christmas Party",
      supportedLayouts: ["b"], // Only layout B is supported
      imagePath: xmasFrameB,
    }, */
  {
    id: "intern_day",
    name: "Grand Duty",
    supportedLayouts: ["b"], // Only layout B is supported
    imagePath: internDayFrameB,
  },
];

// Pastel color palette options
export const colorOptions = [
  { color: "#ffffff", name: "White" },
  { color: "#FFB6C1", name: "Pastel Pink" },
  { color: "#ADD8E6", name: "Pastel Blue" },
  { color: "#BDFCC9", name: "Pastel Green" },
  { color: "#FFDAB9", name: "Peach" },
  { color: "#E6E6FA", name: "Lavender" },
];

//! Photo Strip Preview Constants End
