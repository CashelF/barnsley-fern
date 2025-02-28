# Barnsley Fern

An interactive visualization of the Barnsley Fern fractal with infinite zoom capability. Try it out at https://www.cashel.dev/barnsley-fern

## About the Barnsley Fern

The Barnsley Fern is a fractal named after the British mathematician Michael Barnsley. It uses an iterated function system (IFS) to create a pattern that resembles a fern leaf. The fascinating aspect of this fractal is that its self-similar nature becomes evident as you zoom in, revealing patterns similar to the whole within its smaller parts.

## Features

- **Interactive Visualization**: Dynamically renders the Barnsley Fern fractal
- **Infinite Zoom**: Zoom in to explore the fractal's self-similar patterns in detail
- **Pan Navigation**: Drag to navigate around different areas of the fractal
- **Adaptive Resolution**: Automatically increases point density when zooming in for detailed exploration
- **Responsive Design**: Works on both desktop and mobile devices
- **Performance Optimized**: Uses canvas for efficient rendering of thousands of points

## How to Use

- **Zoom**: Use the mouse wheel or pinch gesture (on touch devices)
- **Pan**: Click and drag or swipe (on touch devices)
- **Reset**: Click the "Reset View" button to return to the initial view

## Technologies Used

- React
- HTML5 Canvas
- CSS3

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/barnsley-fern.git
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Open your browser and visit: `http://localhost:3000`

## How It Works

The Barnsley Fern is generated using the following set of transformations:

1. f₁(x,y) = (0, 0.16y) with probability 0.01
2. f₂(x,y) = (0.85x + 0.04y, -0.04x + 0.85y + 1.6) with probability 0.85
3. f₃(x,y) = (0.2x - 0.26y, 0.23x + 0.22y + 1.6) with probability 0.07
4. f₄(x,y) = (-0.15x + 0.28y, 0.26x + 0.24y + 0.44) with probability 0.07

Starting from the point (0,0), the algorithm repeatedly applies one of these transformations, chosen randomly according to the specified probabilities. After several iterations, the resulting points form the fern pattern.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### `npm test`

Launches the test runner in the interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

## License

MIT
