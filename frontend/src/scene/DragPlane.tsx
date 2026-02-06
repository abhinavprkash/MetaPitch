import { useStore } from '../store'
import { FIELD_HALF_LENGTH, FIELD_HALF_WIDTH } from '../utils/constants'

export function DragPlane() {
  const playing = useStore((s) => s.playing)
  const selectedPlayer = useStore((s) => s.selectedPlayer)
  const dragging = useStore((s) => s.dragging)
  const setDragging = useStore((s) => s.setDragging)
  const setDragOverride = useStore((s) => s.setDragOverride)

  if (playing || !selectedPlayer) return null

  return (
    <mesh
      position={[0, 0.02, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      visible={true}
      onPointerMove={(e) => {
        if (!dragging || !selectedPlayer) return
        e.stopPropagation()
        const fieldX = e.point.x + FIELD_HALF_LENGTH
        const fieldY = e.point.z + FIELD_HALF_WIDTH
        setDragOverride(selectedPlayer, [fieldX, fieldY])
      }}
      onClick={(e) => {
        e.stopPropagation()
        if (useStore.getState().cameraMode === 'ego') {
          useStore.getState().setCameraMode('3d')
          useStore.getState().setSelectedPlayer(null)
          return
        }
        if (dragging) {
          setDragging(false)
          useStore.getState().setSelectedPlayer(null)
        }
      }}
    >
      <planeGeometry args={[200, 200]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}
