import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { SideType } from '../types';
import { JointSlider } from './JointSlider';

export interface JointDraftItem {
  id: string;
  joint: string;
  customJoint?: string;
  side: SideType;
  severity: number | null;
}

interface JointEntryCardProps {
  index: number;
  item: JointDraftItem;
  sortedJointOptions: string[];
  onChange: (updated: JointDraftItem) => void;
  onRemove?: () => void;
  canRemove: boolean;
  showErrors?: boolean;
}

export const JointEntryCard: React.FC<JointEntryCardProps> = ({
  index,
  item,
  sortedJointOptions,
  onChange,
  onRemove,
  canRemove,
  showErrors = false
}) => {
  const [isOtherSelected, setIsOtherSelected] = useState<boolean>(() => {
    return !sortedJointOptions.includes(item.joint) && item.joint.length > 0;
  });

  const handleJointSelect = (selected: string) => {
    if (selected === '__OTHER__') {
      setIsOtherSelected(true);
      onChange({
        ...item,
        joint: item.customJoint || ''
      });
    } else {
      setIsOtherSelected(false);
      onChange({
        ...item,
        joint: selected
      });
    }
  };

  const handleCustomJointChange = (customVal: string) => {
    onChange({
      ...item,
      joint: customVal,
      customJoint: customVal
    });
  };

  // Side toggle handler: left and right can both or neither be active
  const toggleSide = (sideToToggle: 'left' | 'right') => {
    let nextSide: SideType;
    if (item.side === 'none') {
      nextSide = sideToToggle;
    } else if (item.side === 'both') {
      nextSide = sideToToggle === 'left' ? 'right' : 'left';
    } else if (item.side === sideToToggle) {
      // Uncheck it
      nextSide = 'none';
    } else {
      // It was the other side, now both are active
      nextSide = 'both';
    }

    onChange({
      ...item,
      side: nextSide
    });
  };

  const isLeftActive = item.side === 'left' || item.side === 'both';
  const isRightActive = item.side === 'right' || item.side === 'both';

  const isJointMissing = showErrors && !item.joint.trim();
  const isSeverityMissing = showErrors && item.severity === null;

  return (
    <div className="bg-[#0c1322] border border-cyan-950/70 rounded-2xl p-4 shadow-md space-y-4 transition-all">
      {/* Header of Joint Card */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
          Joint #{index + 1}
        </span>
        {canRemove && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
            title="Remove this joint"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Joint Picker & Side Toggles in a grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Joint Selection */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Joint <span className="text-cyan-400">*</span>
          </label>
          <div className="space-y-2">
            <select
              value={isOtherSelected ? '__OTHER__' : item.joint}
              onChange={(e) => handleJointSelect(e.target.value)}
              className={`w-full bg-[#070c18] border rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors ${
                isJointMissing ? 'border-red-500' : 'border-slate-800'
              }`}
            >
              {sortedJointOptions.map((j) => (
                <option key={j} value={j} className="bg-[#0c1322] text-slate-100">
                  {j}
                </option>
              ))}
              <option value="__OTHER__" className="bg-[#0c1322] text-cyan-300">
                ✏️ Other (Enter custom joint)...
              </option>
            </select>

            {isOtherSelected && (
              <input
                type="text"
                value={item.customJoint || (sortedJointOptions.includes(item.joint) ? '' : item.joint)}
                onChange={(e) => handleCustomJointChange(e.target.value)}
                placeholder="e.g. Neck, Lower back, Big toe..."
                autoFocus
                className={`w-full bg-[#070c18] border rounded-xl px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                  isJointMissing ? 'border-red-500' : 'border-slate-700'
                }`}
              />
            )}
          </div>
        </div>

        {/* Side Toggle Buttons: Left / Right (both or neither can be selected) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Side
          </label>
          <div className="grid grid-cols-2 gap-2 h-10">
            <button
              type="button"
              onClick={() => toggleSide('left')}
              className={`rounded-xl text-xs font-bold transition-all flex items-center justify-center border touch-manipulation ${
                isLeftActive
                  ? 'bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/25'
                  : 'bg-[#070c18] text-slate-400 border-slate-800/80 hover:text-slate-200'
              }`}
            >
              LEFT
            </button>
            <button
              type="button"
              onClick={() => toggleSide('right')}
              className={`rounded-xl text-xs font-bold transition-all flex items-center justify-center border touch-manipulation ${
                isRightActive
                  ? 'bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/25'
                  : 'bg-[#070c18] text-slate-400 border-slate-800/80 hover:text-slate-200'
              }`}
            >
              RIGHT
            </button>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 text-center">
            {item.side === 'both' ? 'Both sides selected' : item.side === 'none' ? 'No side specified' : `${item.side.toUpperCase()} only`}
          </div>
        </div>
      </div>

      {/* Severity Slider */}
      <div className="pt-1">
        <JointSlider
          value={item.severity}
          onChange={(val) => onChange({ ...item, severity: val })}
          requiredError={isSeverityMissing}
        />
      </div>
    </div>
  );
};
