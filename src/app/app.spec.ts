import { App, SOLAR_SYSTEM_PLANETS } from './app';

describe('App', () => {
  it('lists the eight planets in order from the Sun', () => {
    expect(SOLAR_SYSTEM_PLANETS).toHaveLength(8);
    expect(SOLAR_SYSTEM_PLANETS.map((planet) => planet.name)).toEqual([
      'Mercurio',
      'Venus',
      'Tierra',
      'Marte',
      'Júpiter',
      'Saturno',
      'Urano',
      'Neptuno',
    ]);
  });

  it('updates the exploration card when a planet is selected', () => {
    const app = new App();

    app.selectPlanet(SOLAR_SYSTEM_PLANETS[5]);

    expect(app.selectedPlanet().name).toBe('Saturno');
    expect(app.selectedPlanet().moons).toBe('146');
  });

  it('supports playback, orbit visibility, and only the available speeds', () => {
    const app = new App();

    app.togglePlayback();
    app.toggleOrbits();
    app.setSpeed(2);
    app.setSpeed(5);

    expect(app.paused()).toBe(true);
    expect(app.showOrbits()).toBe(false);
    expect(app.speed()).toBe(2);
  });
});
