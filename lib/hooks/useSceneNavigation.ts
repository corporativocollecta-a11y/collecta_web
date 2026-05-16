import { useCallback, useState } from 'react';

export type SceneType = 'home' | 'ecosistema' | 'clientes' | 'productores' | 'impacto' | 'impacto';

export function useSceneNavigation() {
  const [currentScene, setCurrentScene] = useState<SceneType>('home');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const navigateTo = useCallback((scene: SceneType) => {
    if (isTransitioning) return;

    setIsTransitioning(true);

    // Animate transition
    setTimeout(() => {
      setCurrentScene(scene);
    }, 300);

    setTimeout(() => {
      setIsTransitioning(false);
    }, 600);
  }, [isTransitioning]);

  return {
    currentScene,
    isTransitioning,
    navigateTo,
  };
}
