import React from 'react';
import { RuleCheckHistoryItem } from '../types';

interface RuleCheckHistoryTableProps {
  history?: RuleCheckHistoryItem[];
  loading?: boolean;
}

/**
 * @deprecated Thành phần này đã được lược bỏ khỏi giao diện chính theo yêu cầu nghiệp vụ
 */
export const RuleCheckHistoryTable: React.FC<RuleCheckHistoryTableProps> = () => {
  return null;
};

export default RuleCheckHistoryTable;
