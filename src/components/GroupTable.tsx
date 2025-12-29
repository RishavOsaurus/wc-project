import { useState, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import type { Group, Team } from '../types/worldcup';
import './GroupTable.css';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface GroupTableProps {
  group: Group;
  onOrderChange?: (teams: (Team & { uniqueId: string })[]) => void;
  /** When true all rows become non-draggable (locked in place) */
  lockAll?: boolean;
}

interface SortableTeamRowProps {
  team: Team & { uniqueId: string };
  index: number;
  id: string;
  isLocked?: boolean;
}

const DragHandle = ({ style }: { style?: CSSProperties }) => (
  <span
    style={{ ...style, cursor: 'move', userSelect: 'none' }}
    tabIndex={0}
    aria-label="Drag handle"
  >
    ⠿
  </span>
);

const SortableTeamRow = ({ team, index, id, isLocked }: SortableTeamRowProps) => {
  if (isLocked) {
    return (
      <tr className={team.isPlayoff ? 'playoff-row locked-row' : 'locked-row'}>
        <td className="position">{index + 1}</td>
        <td style={{ width: 50 }} />
        <td className="team-name">
          {team.flag && <span className="flag">{team.flag}</span>}
          <span className={team.isPlayoff ? 'playoff-text' : ''}>{team.name}</span>
        </td>
      </tr>
    );
  }

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={team.isPlayoff ? 'playoff-row' : ''}
    >
      <td className="position">{index + 1}</td>
      <td className="drag-handle" {...attributes} {...listeners}>
        <DragHandle />
      </td>
      <td className="team-name">
        {team.flag && <span className="flag">{team.flag}</span>}
        <span className={team.isPlayoff ? 'playoff-text' : ''}>
          {team.name}
        </span>
      </td>
    </tr>
  );
};

export default function GroupTable({ group, onOrderChange, lockAll }: GroupTableProps) {
  // Add stable IDs to teams when component mounts
  const [teams, setTeams] = useState<(Team & { uniqueId: string })[]>(() =>
    group.teams.map((team) => ({ ...team, uniqueId: `${group.name}-${team.name}` }))
  );
  const teamsRef = useRef<(Team & { uniqueId: string })[]>(teams);
  useEffect(() => { teamsRef.current = teams; }, [teams]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // If locking is enabled, ignore any attempts to drag/replace locked rows
    if (!over || active.id === over.id) return;
    if (lockAll) return;

    setTeams((items) => {
      const oldIndex = items.findIndex((item) => item.uniqueId === active.id);
      const newIndex = items.findIndex((item) => item.uniqueId === over.id);
      const newTeams = arrayMove(items, oldIndex, newIndex);
      return newTeams;
    });
  };

  // Use a ref to hold the latest onOrderChange callback so the effect
  // below only depends on `teams` and won't re-run when the parent
  // recreates the callback each render (which would cause loops).
  const onOrderChangeRef = useRef(onOrderChange);
  useEffect(() => { onOrderChangeRef.current = onOrderChange; }, [onOrderChange]);

  // Notify parent when internal `teams` state changes (after render)
  useEffect(() => {
    onOrderChangeRef.current?.(teams);
  }, [teams]);

  // Sync when parent `group.teams` changes — but only update internal
  // state if the incoming order actually differs to avoid loops.
  useEffect(() => {
    const incoming = group.teams.map((team) => ({ ...team, uniqueId: `${group.name}-${team.name}` }));
    const current = teamsRef.current || [];
    const same = incoming.length === current.length && incoming.every((it, i) => it.uniqueId === current[i]?.uniqueId && it.name === current[i]?.name);
    if (!same) {
      setTeams(incoming);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.teams, group.name]);

  return (
    <div className="group-card">
      <div className="group-header">
        <h2>{group.name}</h2>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <table className="group-table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>#</th>
              <th style={{ width: '50px' }}>⠿</th>
              <th>Team</th>
            </tr>
          </thead>
          <SortableContext
            items={teams.filter(t => !lockAll).map((team) => team.uniqueId)}
            strategy={verticalListSortingStrategy}
          >
            <tbody>
              {teams.map((team, index) => (
                <SortableTeamRow
                  key={team.uniqueId}
                  id={team.uniqueId}
                  team={team}
                  index={index}
                  isLocked={!!lockAll}
                />
              ))}
            </tbody>
          </SortableContext>
        </table>
      </DndContext>
    </div>
  );
}
