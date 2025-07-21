import React, { useState } from 'react';
import MonacoEditor from '../ui/MonacoEditor';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import Button from '../ui/Button';
import IconButton from '../ui/IconButton';
import Badge from '../ui/Badge';
import IconWrapper from '../ui/IconWrapper';
import Tooltip from '../ui/Tooltip';
import { FiRefreshCw, FiTrash2, FiArrowRight, FiPlus, FiMinus, FiEdit2, FiCheck, FiCode } from 'react-icons/fi';

type DiffStatus = 'added' | 'removed' | 'changed' | 'unchanged';
interface DiffRow {
    key: string;
    left: any;
    right: any;
    status: DiffStatus;
}

const getJsonDiff = (a: any, b: any): DiffRow[] => {
    const result: DiffRow[] = [];
    const aKeys = a && typeof a === 'object' ? Object.keys(a) : [];
    const bKeys = b && typeof b === 'object' ? Object.keys(b) : [];
    const allKeys = Array.from(new Set([...aKeys, ...bKeys]));
    for (const key of allKeys) {
        if (!(key in a)) {
            result.push({ key, left: undefined, right: b[key], status: 'added' });
        } else if (!(key in b)) {
            result.push({ key, left: a[key], right: undefined, status: 'removed' });
        } else if (JSON.stringify(a[key]) !== JSON.stringify(b[key])) {
            result.push({ key, left: a[key], right: b[key], status: 'changed' });
        } else {
            result.push({ key, left: a[key], right: b[key], status: 'unchanged' });
        }
    }
    return result;
};

const statusMeta: Record<DiffStatus, { variant: string; label: string; icon: React.ReactNode }> = {
    added: { variant: 'success', label: 'Added', icon: <IconWrapper icon={FiPlus} size="xs" className="text-green-600" /> },
    removed: { variant: 'danger', label: 'Removed', icon: <IconWrapper icon={FiMinus} size="xs" className="text-red-600" /> },
    changed: { variant: 'warning', label: 'Changed', icon: <IconWrapper icon={FiEdit2} size="xs" className="text-orange-500" /> },
    unchanged: { variant: 'default', label: 'Unchanged', icon: <IconWrapper icon={FiCheck} size="xs" className="text-gray-400" /> },
};

const exampleLeft = `{
  "name": "Alice",
  "age": 30,
  "city": "New York",
  "skills": ["JavaScript", "React"],
  "active": true
}`;
const exampleRight = `{
  "name": "Alice",
  "age": 31,
  "country": "USA",
  "skills": ["JavaScript", "React", "TypeScript"],
  "active": true
}`;

const JsonDiffTool: React.FC = () => {
    const [left, setLeft] = useState(exampleLeft);
    const [right, setRight] = useState(exampleRight);
    const [diff, setDiff] = useState<DiffRow[]>([]);
    const [error, setError] = useState('');

    const handleCompare = () => {
        setError('');
        try {
            const leftJson = JSON.parse(left);
            const rightJson = JSON.parse(right);
            setDiff(getJsonDiff(leftJson, rightJson));
        } catch {
            setError('Invalid JSON input.');
            setDiff([]);
        }
    };

    const handleSwap = () => {
        setLeft(right);
        setRight(left);
        setDiff([]);
        setError('');
    };

    const handleClear = () => {
        setLeft('');
        setRight('');
        setDiff([]);
        setError('');
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950 py-8 px-2">
            <Card className="w-full max-w-5xl p-6 shadow-2xl rounded-2xl">
                <SectionHeader
                    icon={FiCode}
                    title="JSON Diff Tool"
                    description="Compare two JSON objects and see their differences visually."
                />
                <div className="flex flex-col md:flex-row gap-6 mt-6">
                    <div className="flex-1 flex flex-col">
                        <label className="mb-2 font-semibold text-gray-700 dark:text-gray-200">Left JSON</label>
                        <MonacoEditor
                            value={left}
                            onChange={v => setLeft(v || '')}
                            language="json"
                            height={260}
                            label=""
                            className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                        />
                    </div>
                    <div className="flex flex-col items-center justify-center gap-2 md:gap-4 mt-2 md:mt-0">
                        <Tooltip content="Swap JSONs">
                            <IconButton
                                icon={FiRefreshCw}
                                onClick={handleSwap}
                                className="mb-2"
                                size="md"
                                variant="default"
                            />
                        </Tooltip>
                        <Tooltip content="Clear Both">
                            <IconButton
                                icon={FiTrash2}
                                onClick={handleClear}
                                size="md"
                                variant="danger"
                            />
                        </Tooltip>
                        <Button
                            onClick={handleCompare}
                            className="mt-4"
                            size="md"
                            variant="primary"
                            icon={FiArrowRight}
                            iconPosition="left"
                        >
                            Compare
                        </Button>
                    </div>
                    <div className="flex-1 flex flex-col">
                        <label className="mb-2 font-semibold text-gray-700 dark:text-gray-200">Right JSON</label>
                        <MonacoEditor
                            value={right}
                            onChange={v => setRight(v || '')}
                            language="json"
                            height={260}
                            label=""
                            className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                        />
                    </div>
                </div>
                {error && (
                    <div className="mt-4">
                        <Badge variant="danger" className="text-sm"><IconWrapper icon={FiMinus} size="xs" className="mr-1" />{error}</Badge>
                    </div>
                )}
                <div className="mt-8">
                    <SectionHeader
                        icon={FiCode}
                        title="Diff Result"
                        description="Color-coded differences between the two JSONs."
                    />
                    <Card className="mt-4 p-0 overflow-x-auto">
                        {diff.length > 0 ? (
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-100 dark:bg-gray-800">
                                        <th className="py-2 px-3 text-left font-semibold">Key</th>
                                        <th className="py-2 px-3 text-left font-semibold">Left</th>
                                        <th className="py-2 px-3 text-left font-semibold">Right</th>
                                        <th className="py-2 px-3 text-left font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {diff.map(({ key, left, right, status }) => (
                                        <tr key={key} className={
                                            status === 'added' ? 'bg-green-50 dark:bg-green-900/20' :
                                                status === 'removed' ? 'bg-red-50 dark:bg-red-900/20' :
                                                    status === 'changed' ? 'bg-orange-50 dark:bg-orange-900/20' :
                                                        'bg-white dark:bg-gray-900'}>
                                            <td className="py-2 px-3 font-mono break-all align-top">{key}</td>
                                            <td className="py-2 px-3 font-mono break-all align-top">{left === undefined ? <span className="opacity-50">-</span> : JSON.stringify(left)}</td>
                                            <td className="py-2 px-3 font-mono break-all align-top">{right === undefined ? <span className="opacity-50">-</span> : JSON.stringify(right)}</td>
                                            <td className="py-2 px-3 align-top">
                                                <Badge variant={statusMeta[status].variant as any} className="inline-flex items-center gap-1">
                                                    {statusMeta[status].icon}
                                                    {statusMeta[status].label}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="text-gray-500 text-center py-8">No diff to display. Enter JSON and click Compare.</div>
                        )}
                    </Card>
                </div>
            </Card>
        </div>
    );
};

export default JsonDiffTool; 