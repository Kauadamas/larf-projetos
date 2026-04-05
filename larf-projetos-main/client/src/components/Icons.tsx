import { 
  Rocket, CheckCircle2, DollarSign, Users, TrendingUp, 
  FileText, Eye, Edit2, Trash2, Lock, Key, AlertOctagon,
  Clock, Calendar, User, FileCheck, BarChart3, AlertCircle
} from "lucide-react";

export const Icons = {
  // Actions
  rocket: (props?: any) => <Rocket {...props} />,
  check: (props?: any) => <CheckCircle2 {...props} />,
  money: (props?: any) => <DollarSign {...props} />,
  users: (props?: any) => <Users {...props} />,
  trending: (props?: any) => <TrendingUp {...props} />,
  document: (props?: any) => <FileText {...props} />,
  view: (props?: any) => <Eye {...props} />,
  edit: (props?: any) => <Edit2 {...props} />,
  delete: (props?: any) => <Trash2 {...props} />,
  
  // Security
  lock: (props?: any) => <Lock {...props} />,
  key: (props?: any) => <Key {...props} />,
  warning: (props?: any) => <AlertOctagon {...props} />,
  
  // Time & Date
  clock: (props?: any) => <Clock {...props} />,
  calendar: (props?: any) => <Calendar {...props} />,
  
  // Status
  user: (props?: any) => <User {...props} />,
  task: (props?: any) => <FileCheck {...props} />,
  chart: (props?: any) => <BarChart3 {...props} />,
  info: (props?: any) => <AlertCircle {...props} />,
};

export function IconWrapper({ icon, size = 16 }: { icon: string; size?: number }) {
  const iconMap: Record<string, any> = {
    "rocket": Icons.rocket,
    "check": Icons.check,
    "money": Icons.money,
    "users": Icons.users,
    "trending": Icons.trending,
    "document": Icons.document,
    "view": Icons.view,
    "edit": Icons.edit,
    "delete": Icons.delete,
    "lock": Icons.lock,
    "key": Icons.key,
    "warning": Icons.warning,
    "clock": Icons.clock,
    "calendar": Icons.calendar,
    "user": Icons.user,
    "task": Icons.task,
    "chart": Icons.chart,
    "info": Icons.info,
  };
  
  const IconComponent = iconMap[icon];
  return IconComponent ? <IconComponent size={size} /> : null;
}
