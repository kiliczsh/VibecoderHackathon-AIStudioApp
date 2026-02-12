
import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, UserRole } from '../types';
import { CATEGORY_COLORS } from '../constants';
import Button from './Button';
import { getTaskLocationContext } from '../services/gemini';

interface TaskCardProps {
  task: Task;
  userRole: UserRole;
  onAction: (taskId: string, action: 'accept' | 'complete' | 'verify') => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, userRole, onAction }) => {
  const [mapsLinks, setMapsLinks] = useState<{uri: string, title: string}[]>([]);
  const [isVerifyingLocation, setIsVerifyingLocation] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const statusLabels = {
    [TaskStatus.OPEN]: 'Active',
    [TaskStatus.IN_PROGRESS]: 'In Progress',
    [TaskStatus.COMPLETED]: 'Ready for Review',
    [TaskStatus.VERIFIED]: 'Payout Released',
  };

  const statusColors = {
    [TaskStatus.OPEN]: 'text-forest bg-leaf/10 border-leaf/20',
    [TaskStatus.IN_PROGRESS]: 'text-forest bg-sand border-forest/10',
    [TaskStatus.COMPLETED]: 'text-paper bg-forest border-forest',
    [TaskStatus.VERIFIED]: 'text-paper bg-leaf border-leaf',
  };

  useEffect(() => {
    const fetchContext = async () => {
      if (task.location && task.location !== 'Your Neighborhood') {
        setIsVerifyingLocation(true);
        const context = await getTaskLocationContext(task.location);
        if (context?.links) {
          setMapsLinks(context.links);
        }
        setIsVerifyingLocation(false);
      }
    };
    fetchContext();
  }, [task.location]);

  return (
    <article 
      className="bg-paper p-8 rounded-[40px] shadow-sm border border-forest/5 flex flex-col justify-between min-h-[350px] transition-all hover:-translate-y-2 hover:shadow-xl hover:shadow-forest/5 relative group"
      aria-labelledby={`task-title-${task.id}`}
    >
      <div className="flex-1">
        <div className="flex justify-between items-start mb-4">
          <span className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${CATEGORY_COLORS[task.category]}`}>
            {task.category}
          </span>
          <span className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${statusColors[task.status]}`}>
            {statusLabels[task.status]}
          </span>
        </div>
        
        <h3 
          id={`task-title-${task.id}`} 
          className="text-2xl font-heading text-forest mb-4 leading-tight group-hover:text-earth transition-colors cursor-pointer flex justify-between items-start gap-4 select-none"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span>{task.title}</span>
          <svg 
            className={`w-5 h-5 mt-2 flex-shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </h3>
        
        <p className={`text-brandText/70 font-medium leading-relaxed transition-all duration-300 ${isExpanded ? 'line-clamp-none' : 'line-clamp-3'}`}>
          {task.description}
        </p>

        <div className="mt-6 flex items-center text-sm font-bold text-forest/60">
           <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
           </svg>
           {task.location}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-black/5 flex justify-between items-center">
        <div className="flex items-center gap-2 text-forest font-bold">
          <svg className="w-5 h-5 text-leaf" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM5.12 5.12A7.04 7.04 0 1114.88 14.88 7.04 7.04 0 015.12 5.12zM10 13a3 3 0 100-6 3 3 0 000 6z" />
          </svg>
          <span className="text-lg">{task.creditValue} Credits</span>
        </div>

        <div className="flex gap-2">
           {userRole === UserRole.TEEN && task.status === TaskStatus.OPEN && (
             <Button size="sm" onClick={() => onAction(task.id, 'accept')}>Accept</Button>
           )}
           {userRole === UserRole.TEEN && task.status === TaskStatus.IN_PROGRESS && (
             <Button size="sm" variant="outline" onClick={() => onAction(task.id, 'complete')}>Done</Button>
           )}
           {userRole === UserRole.ADMIN && task.status === TaskStatus.COMPLETED && (
             <Button size="sm" onClick={() => onAction(task.id, 'verify')}>Pay</Button>
           )}
        </div>
      </div>
    </article>
  );
};

export default TaskCard;
