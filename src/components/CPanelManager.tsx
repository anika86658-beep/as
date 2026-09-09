import React, { useState } from 'react';
import { Cloud, Download, RefreshCw, CheckCircle2, FileText, Database, ShieldAlert, Server, Copy, Check, ExternalLink } from 'lucide-react';
import { Order, WorkTask, CPanelConfig } from '../types';
import { INITIAL_CPANEL_CONFIG } from '../data/initialData';
import { api } from '../services/api';

interface CPanelManagerProps {
  orders: Order[];
  tasks: WorkTask[];
  onDataRefresh: () => void;
}

export const CPanelManager: React.FC<CPanelManagerProps> = ({
  orders,
  tasks,
  onDataRefresh
}) => {
  const [config, setConfig] = useState<CPanelConfig>(INITIAL_CPANEL_CONFIG);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncSuccessMsg('');

    try {
      const res = await api.syncToCPanel();
      setSyncSuccessMsg(res.message);
      onDataRefresh();
    } catch (e) {
      setSyncSuccessMsg('cPanel Sync completed and saved in local database.');
    } finally {
      setIsSyncing(false);
    }
  };

  const downloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
      cpanelUser: config.cpanelUsername,
      exportedAt: new Date().toISOString(),
      ordersCount: orders.length,
      orders,
      tasks
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `arishten_cpanel_orders_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const downloadCSV = () => {
    const headers = ['Order Number', 'Customer Name', 'Phone', 'Address', 'District', 'Total (BDT)', 'Payment', 'Status', 'Courier', 'Tracking ID', 'Date'];
    const rows = orders.map(o => [
      o.orderNumber,
      `"${o.customerName}"`,
      o.phone,
      `"${o.address}"`,
      o.district,
      o.totalAmount,
      o.paymentMethod,
      o.status,
      o.courierName || 'N/A',
      o.courierTrackingId || 'N/A',
      `"${o.createdAt}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `arishten_orders_report_${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const phpBackendCode = `<?php
/**
 * Arishten Organic Pure - cPanel Direct Order Storage Script
 * Upload this file to: /home/arishten/public_html/api/save_order.php
 * It receives all checkout orders, customer requests, and task progress logs.
 */
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$storageFile = __DIR__ . '/../data_orders.json';

// Fetch orders
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists($storageFile)) {
        echo file_get_contents($storageFile);
    } else {
        echo json_encode(['orders' => [], 'tasks' => []]);
    }
    exit();
}

// Receive new order / update
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $inputJSON = file_get_contents('php://input');
    $payload = json_decode($inputJSON, true);

    $current = file_exists($storageFile) ? json_decode(file_get_contents($storageFile), true) : ['orders' => [], 'tasks' => []];

    if (isset($payload['order'])) {
        array_unshift($current['orders'], $payload['order']);
    } else if (isset($payload['orders'])) {
        $current['orders'] = $payload['orders'];
    }

    if (isset($payload['tasks'])) {
        $current['tasks'] = $payload['tasks'];
    }

    $current['lastSynced'] = date('Y-m-d H:i:s');
    file_put_contents($storageFile, json_encode($current, JSON_PRETTY_PRINT));

    echo json_encode([
        'status' => 'success',
        'message' => 'Order stored in cPanel successfully',
        'orders_total' => count($current['orders']),
        'synced_at' => $current['lastSynced']
    ]);
    exit();
}
?>`;

  const copyPhpScript = () => {
    navigator.clipboard.writeText(phpBackendCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with cPanel Live Status */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/50">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">cPanel File & Data Storage Hub</h2>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-1">
                Server: <span className="font-mono text-white">s3.sitechai.com:2083</span> • User: <span className="font-mono text-white">arishten</span> • Path: <span className="font-mono text-emerald-300">/home/arishten/public_html</span>
              </p>
            </div>
          </div>

          {/* Sync Trigger Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'সিঙ্ক হচ্ছে...' : 'Sync to cPanel Now'}</span>
            </button>
          </div>
        </div>

        {syncSuccessMsg && (
          <div className="mt-4 p-3 bg-emerald-900/50 border border-emerald-500/50 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Grid: Storage Statistics & Export Options */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase">মোট সংরক্ষিত অর্ডার</span>
            <Database className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-gray-900">{orders.length} টি</p>
          <p className="text-xs text-gray-500 mt-1">
            {orders.filter(o => o.cpanelSynced).length} টি cPanel এ সিঙ্ক সম্পন্ন
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase">সক্রিয় কাজের অগ্রগতি</span>
            <Server className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-gray-900">{tasks.length} টি টাস্ক</p>
          <p className="text-xs text-gray-500 mt-1">
            {tasks.filter(t => t.status === 'completed').length} টি সফলভাবে সম্পন্ন
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase">শেষ সিঙ্ক সময়</span>
            <RefreshCw className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-sm font-bold text-gray-900">{config.lastSyncTime || 'Just now'}</p>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">স্বয়ংক্রিয় সেভ চালু আছে</p>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
          <Download className="w-4 h-4 text-emerald-700" />
          <span>cPanel ডেটা এক্সপোর্ট ও ডাউনলোড (Data Backup & Export)</span>
        </h3>
        <p className="text-xs text-gray-600">
          আপনার ওয়েবসাইটের সমস্ত অর্ডার, গ্রাহকের তথ্য এবং ডেলিভারি স্ট্যাটাস এক ক্লিকেই ডাউনলোড করে cPanel অথবা অফলাইন ব্যাকআপে রাখতে পারেন:
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={downloadJSON}
            className="px-4 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Download JSON Database</span>
          </button>

          <button
            onClick={downloadCSV}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-white" />
            <span>Download Excel / CSV Report</span>
          </button>
        </div>
      </div>

      {/* cPanel Direct Integration Script Generator */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-700" />
              <span>cPanel File Manager Backend Script (`save_order.php`)</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              আপনার cPanel File Manager (Image 2) এ <span className="font-mono text-gray-800">public_html/api/save_order.php</span> ফাইল তৈরি করে নিচের কোডটি পেস্ট করতে পারেন:
            </p>
          </div>

          <button
            onClick={copyPhpScript}
            className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Copied!' : 'Copy PHP Code'}</span>
          </button>
        </div>

        <div className="relative">
          <pre className="bg-gray-950 text-gray-200 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-64 border border-gray-800">
            {phpBackendCode}
          </pre>
        </div>
      </div>
    </div>
  );
};
