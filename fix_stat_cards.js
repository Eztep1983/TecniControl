const fs = require('fs');
let c = fs.readFileSync('src/app/(app)/ordenes/page.tsx', 'utf8');

const newStatCard = `  }: {
    icon: React.ElementType
    value: number
    label: string
    colorPrefix?: string
    onClick?: () => void
  }) => {
    const Component = onClick ? 'button' : 'div'
    
    // Default colors if no prefix is provided
    let bgClass = 'dark:bg-gray-800/40 bg-gray-100 border-gray-200 dark:border-gray-700/50 hover:bg-gray-200 hover:dark:bg-gray-800/60'
    let textClass = 'dark:text-white text-gray-900'
    let iconClass = 'dark:text-gray-400 text-gray-500'
    let labelClass = 'dark:text-gray-400 text-gray-600'

    if (colorPrefix === 'green') {
      bgClass = 'bg-green-500/15 dark:bg-green-500/10 border-green-500/30 hover:bg-green-500/25 hover:dark:bg-green-500/20'
      textClass = 'text-green-800 dark:text-green-300'
      iconClass = 'text-green-600 dark:text-green-400'
      labelClass = 'text-green-700 dark:text-green-400'
    } else if (colorPrefix === 'orange') {
      bgClass = 'bg-orange-500/15 dark:bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/25 hover:dark:bg-orange-500/20'
      textClass = 'text-orange-800 dark:text-orange-300'
      iconClass = 'text-orange-600 dark:text-orange-400'
      labelClass = 'text-orange-700 dark:text-orange-400'
    } else if (colorPrefix === 'blue') {
      bgClass = 'bg-blue-500/15 dark:bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/25 hover:dark:bg-blue-500/20'
      textClass = 'text-blue-800 dark:text-blue-300'
      iconClass = 'text-blue-600 dark:text-blue-400'
      labelClass = 'text-blue-700 dark:text-blue-400'
    } else if (colorPrefix === 'purple') {
      bgClass = 'bg-purple-500/15 dark:bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/25 hover:dark:bg-purple-500/20'
      textClass = 'text-purple-800 dark:text-purple-300'
      iconClass = 'text-purple-600 dark:text-purple-400'
      labelClass = 'text-purple-700 dark:text-purple-400'
    } else if (colorPrefix === 'amber') {
      bgClass = 'bg-amber-500/15 dark:bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/25 hover:dark:bg-amber-500/20'
      textClass = 'text-amber-800 dark:text-amber-300'
      iconClass = 'text-amber-600 dark:text-amber-400'
      labelClass = 'text-amber-700 dark:text-amber-400'
    } else if (colorPrefix === 'gray') {
      bgClass = 'bg-gray-500/15 dark:bg-gray-500/10 border-gray-500/30 hover:bg-gray-500/25 hover:dark:bg-gray-500/20'
      textClass = 'text-gray-800 dark:text-gray-300'
      iconClass = 'text-gray-600 dark:text-gray-400'
      labelClass = 'text-gray-700 dark:text-gray-400'
    }
    
    return (
      <Component
        onClick={onClick}
        type={onClick ? "button" : undefined}
        className={cn(
          "w-full border rounded-2xl p-2.5",
          "flex flex-col items-center justify-center text-center",
          "transition-all duration-150",
          onClick ? "cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400" : "cursor-default",
          bgClass
        )}
        role={onClick ? "button" : "listitem"}
        aria-label={onClick ? \`Ver órdenes de tipo \${label}\` : undefined}
      >
        <Icon className={cn("w-4 h-4 mb-1", iconClass)} aria-hidden="true" />
        <span className={cn("text-lg font-bold tabular-nums leading-tight", textClass)}>{value}</span>
        <span className={cn("text-[9px] sm:text-[10px] uppercase tracking-wider font-medium text-center leading-tight mt-0.5 break-words max-w-full", labelClass)}>
          {label}
        </span>
      </Component>
    )
  }
)`

// Replace the actual StatCard implementation using a regex
c = c.replace(/  }: \{\n    icon: React\.ElementType\n    value: number\n    label: string\n    colorClass\?: string\n    onClick\?: \(\) => void\n  \}\) => \{[\s\S]*?<\/Component>\n    \)\n  \}/, newStatCard);

// Replace usages
c = c.replace(/colorClass="border-green-500\/20"/g, 'colorPrefix="green"');
c = c.replace(/colorClass="border-orange-500\/20"/g, 'colorPrefix="orange"');
c = c.replace(/colorClass="border-blue-500\/20"/g, 'colorPrefix="blue"');
c = c.replace(/colorClass="border-purple-500\/20"/g, 'colorPrefix="purple"');
c = c.replace(/colorClass="border-amber-500\/20"/g, 'colorPrefix="amber"');
c = c.replace(/<StatCard \n                icon=\{ClipboardList\} \n                value=\{estadisticas.totalOrdenes\} \n                label="Total" \n                onClick=\{\(\) => router.push\('\/ordenes\/mantenimiento'\)\}\n              \/>/, '<StatCard \n                icon={ClipboardList} \n                value={estadisticas.totalOrdenes} \n                label="Total" \n                colorPrefix="gray" \n                onClick={() => router.push(\'/ordenes/mantenimiento\')}\n              />');

fs.writeFileSync('src/app/(app)/ordenes/page.tsx', c, 'utf8');
console.log('Fixed StatCard in ordenes/page.tsx');
