import { Container, Graphics, Sprite, type Texture } from 'pixi.js'
import type { EffectEntity, EnemyEntity, PlayerEntity, ProjectileEntity } from '../entities/entity.ts'
import { damageStage, type CombatAtlasTextures, type ShipIdentity, type ShipTextures } from './game-assets.ts'

export interface ShipVisual {
  container: Container
  sprite: Sprite
  fire: Sprite
  wake: Graphics
}

export interface ProjectileVisual { container: Container; ball: Sprite }
export interface EffectVisual { container: Container; main: Sprite; debris: Sprite[] }

export function createShipVisual(
  identity: ShipIdentity,
  textures: ShipTextures,
  scale: number,
  parent: Container,
): ShipVisual {
  const container = new Container()
  const wake = new Graphics()
    .ellipse(-13, 41, 10, 25).stroke({ color: 0xc9f5ff, alpha: 0.55, width: 3 })
    .ellipse(13, 41, 10, 25).stroke({ color: 0xc9f5ff, alpha: 0.55, width: 3 })
  const sprite = new Sprite(textures.stages[identity].intact)
  sprite.anchor.set(0.5)
  const fire = new Sprite()
  fire.anchor.set(0.5, 0.85)
  fire.position.set(0, 18)
  fire.scale.set(1.15)
  fire.visible = false
  container.addChild(wake, sprite, fire)
  container.scale.set(scale)
  parent.addChild(container)
  return { container, sprite, fire, wake }
}

export function updateShipVisual(
  visual: ShipVisual,
  ship: Pick<PlayerEntity, 'position' | 'rotation' | 'velocity' | 'health' | 'maxHealth'>,
  identity: ShipIdentity,
  textures: ShipTextures,
  elapsedMs: number,
  reducedMotion: boolean,
): void {
  visual.container.position.set(ship.position.x, ship.position.y)
  visual.container.rotation = ship.rotation + Math.PI / 2
  visual.sprite.texture = textures.stages[identity][damageStage(ship.health, ship.maxHealth)]
  const damaged = ship.health > 0 && ship.health / ship.maxHealth <= 2 / 3
  visual.fire.visible = damaged
  visual.wake.visible = !reducedMotion && Math.hypot(ship.velocity.x, ship.velocity.y) > 1
  visual.wake.alpha = 0.35 + (reducedMotion ? 0 : 0.12 * Math.sin(elapsedMs / 90))
}

export function updateDamageFire(
  visual: ShipVisual,
  fireTextures: readonly [Texture, Texture],
  elapsedMs: number,
  reducedMotion: boolean,
): void {
  if (!visual.fire.visible) return
  visual.fire.texture = fireTextures[reducedMotion ? 0 : Math.floor(elapsedMs / 120) % fireTextures.length]
}

export function syncEnemyShipVisuals(
  enemies: readonly EnemyEntity[],
  visuals: Map<string, ShipVisual>,
  layer: Container,
  textures: ShipTextures,
  scales: Readonly<Record<'chaser' | 'shooter', number>>,
  elapsedMs: number,
  fireTextures: readonly [Texture, Texture],
  reducedMotion: boolean,
): void {
  const activeIds = new Set(enemies.map((enemy) => enemy.id))
  for (const [id, visual] of visuals) {
    if (!activeIds.has(id)) { visual.container.destroy({ children: true }); visuals.delete(id) }
  }
  for (const enemy of enemies) {
    let visual = visuals.get(enemy.id)
    if (!visual) {
      visual = createShipVisual(enemy.enemyType, textures, scales[enemy.enemyType], layer)
      visuals.set(enemy.id, visual)
    }
    updateShipVisual(visual, enemy, enemy.enemyType, textures, elapsedMs, reducedMotion)
    updateDamageFire(visual, fireTextures, elapsedMs, reducedMotion)
  }
}

export function syncProjectileVisuals(
  projectiles: readonly ProjectileEntity[],
  visuals: Map<string, ProjectileVisual>,
  layer: Container,
  texture: Texture,
  scale: number,
  reducedMotion: boolean,
): void {
  const activeIds = new Set(projectiles.map((projectile) => projectile.id))
  for (const [id, visual] of visuals) {
    if (!activeIds.has(id)) { visual.container.destroy({ children: true }); visuals.delete(id) }
  }
  for (const projectile of projectiles) {
    let visual = visuals.get(projectile.id)
    if (!visual) {
      const container = new Container()
      if (!reducedMotion) {
        container.addChild(new Graphics().moveTo(-28, 0).lineTo(-7, 0).stroke({ color: 0xffe7a0, alpha: 0.75, width: 3 }))
      }
      const ball = new Sprite(texture)
      ball.anchor.set(0.5)
      ball.scale.set(scale)
      container.addChild(ball)
      layer.addChild(container)
      visual = { container, ball }
      visuals.set(projectile.id, visual)
    }
    visual.container.position.set(projectile.position.x, projectile.position.y)
    visual.container.rotation = projectile.rotation
  }
}

export function syncEffectVisuals(
  effects: readonly EffectEntity[],
  visuals: Map<string, EffectVisual>,
  layer: Container,
  combatTextures: CombatAtlasTextures,
  shipTextures: ShipTextures,
  reducedMotion: boolean,
): void {
  const activeIds = new Set(effects.map((effect) => effect.id))
  for (const [id, visual] of visuals) {
    if (!activeIds.has(id)) { visual.container.destroy({ children: true }); visuals.delete(id) }
  }
  for (const effect of effects) {
    let visual = visuals.get(effect.id)
    if (!visual) {
      visual = createEffectVisual(effect, layer, combatTextures, shipTextures)
      visuals.set(effect.id, visual)
    }
    updateEffectVisual(visual, effect, combatTextures, reducedMotion)
  }
}

function createEffectVisual(
  effect: EffectEntity,
  layer: Container,
  combatTextures: CombatAtlasTextures,
  shipTextures: ShipTextures,
): EffectVisual {
  const container = new Container()
  const mainTexture = effect.effectType === 'sinking'
    ? shipTextures.sunk[effect.shipIdentity ?? 'chaser']
    : effect.effectType === 'muzzle-flash' ? combatTextures.fire[0] : combatTextures.explosion[0]
  const main = new Sprite(mainTexture)
  main.anchor.set(0.5)
  const debris = effect.effectType === 'sinking'
    ? combatTextures.debris.map((texture, index) => {
        const sprite = new Sprite(texture)
        sprite.anchor.set(0.5)
        sprite.rotation = index * 1.3
        container.addChild(sprite)
        return sprite
      })
    : []
  container.addChildAt(main, 0)
  container.position.set(effect.position.x, effect.position.y)
  container.rotation = effect.rotation
  layer.addChild(container)
  return { container, main, debris }
}

function updateEffectVisual(
  visual: EffectVisual,
  effect: EffectEntity,
  textures: CombatAtlasTextures,
  reducedMotion: boolean,
): void {
  const progress = Math.max(0, Math.min(1, 1 - effect.remainingLifetimeMs / effect.durationMs))
  visual.container.position.set(effect.position.x, effect.position.y)
  if (effect.effectType === 'muzzle-flash') {
    visual.main.texture = textures.fire[reducedMotion ? 0 : Math.min(1, Math.floor(progress * 2))]
    visual.main.scale.set(1.15)
  } else if (effect.effectType === 'sinking') {
    visual.main.alpha = reducedMotion ? 0.65 : 1 - progress * 0.8
    visual.main.position.y = reducedMotion ? 0 : progress * 16
    for (let index = 0; index < visual.debris.length; index += 1) {
      const angle = index * (Math.PI * 2 / visual.debris.length) + 0.35
      const distance = reducedMotion ? 18 : 18 + progress * 42
      visual.debris[index].position.set(Math.cos(angle) * distance, Math.sin(angle) * distance)
      visual.debris[index].alpha = 1 - progress
    }
  } else {
    const frameIndex = reducedMotion ? 1 : Math.min(textures.explosion.length - 1, Math.floor(progress * textures.explosion.length))
    visual.main.texture = textures.explosion[frameIndex]
    visual.main.scale.set(effect.effectType === 'explosion' ? 0.9 : 0.52)
    visual.main.alpha = progress > 0.78 ? (1 - progress) / 0.22 : 1
  }
}
