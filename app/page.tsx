'use client';

import Image from "next/image";
import styles from "./page.module.css";
import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

// 定义解除合同情形的类型
type TerminationReason =
  | "negotiated_severance" // 协商一致解除
  | "economic_layoff_notified" // 经济性裁员（已提前30天通知）
  | "contract_expired_employer_not_renew" // 劳动合同到期用人单位不续签
  | "medical_leave_expired_notified" // 医疗期满不能工作（已提前30天通知）
  | "incompetent_notified" // 不胜任工作（已提前30天通知）
  | "objective_change_notified" // 客观情况重大变化（已提前30天通知）
  | "medical_leave_expired_unnotified" // 医疗期满不能工作（未提前30天通知，N+1）
  | "incompetent_unnotified" // 不胜任工作（未提前30天通知，N+1）
  | "objective_change_unnotified" // 客观情况重大变化（未提前30天通知，N+1）
  | "unlawful_termination"; // 用人单位违法解除或终止劳动合同 (2N)

// 定义结果类型
interface CalculationResult {
  totalCompensation: number;
  nMonths?: number;
  nCompensation?: number;
  plusOneCompensation?: number;
  twoNCompensation?: number;
  calculationDetails: Array<{ id: string; text: string }>;
}

export default function Home() {
  // 输入状态
  const [workYears, setWorkYears] = useState<string>("");
  const [workMonths, setWorkMonths] = useState<string>("");
  const [avgMonthlySalary, setAvgMonthlySalary] = useState<string>("");
  const [lastMonthSalary, setLastMonthSalary] = useState<string>("");
  const [localAvgSalaryTripled, setLocalAvgSalaryTripled] = useState<string>(""); // 当地社平工资3倍
  const [terminationReason, setTerminationReason] = useState<TerminationReason>("negotiated_severance");

  // 输出状态
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string>("");

  // 新增访客计数 state
  const [visitorCount, setVisitorCount] = useState<string>("..."); // 初始显示 "..." 或加载图标

  // 创建结果区域的引用
  const resultSectionRef = useRef<HTMLDivElement>(null);

  // 添加useEffect钩子，在客户端加载JavaScript文件
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '/assets/custom-select.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);
  
  // 添加useEffect钩子，在结果出现时滚动到结果区域
  useEffect(() => {
    if (result && resultSectionRef.current) {
      resultSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [result]);

  // 新增：访客计数 useEffect
  useEffect(() => {
    const workerUrl = '	https://nplus.dnext.click/counter'; // 你的 Worker URL

    if (process.env.NODE_ENV === 'development') {
      console.log("Development mode: Setting mock visitor count.");
      setVisitorCount("999");
    } else {
      // 生产环境：调用 Worker
      const fetchVisitorCountFromWorker = async () => {
        try {
          const response = await fetch(workerUrl, {
            method: 'GET',
            headers: {
              'X-Count-Request': 'increment' // 添加自定义头部
            }
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error("Worker response error body:", errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const count = await response.text();
          setVisitorCount(count);
        } catch (fetchError) {
          console.error("从 Worker 获取访客计数失败:", fetchError);
          setVisitorCount("N/A"); // 出错时显示 N/A
        }
      };
      fetchVisitorCountFromWorker();
    }
  }, []); // 空依赖数组，仅在组件挂载时运行

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setResult(null);
    const details: Array<{ id: string; text: string }> = [];

    // 1. 数据解析与校验
    const numWorkYears = Number.parseInt(workYears, 10);
    const numWorkMonths = Number.parseInt(workMonths, 10);
    const numAvgMonthlySalary = Number.parseFloat(avgMonthlySalary);
    const numLastMonthSalary = Number.parseFloat(lastMonthSalary);
    const numLocalAvgSalaryTripled = localAvgSalaryTripled ? Number.parseFloat(localAvgSalaryTripled) : null;

    details.push({ id: 'input-summary-1', text: `输入的工作年限: ${workYears || 0}年${workMonths || 0}月。` });
    details.push({ id: 'input-summary-2', text: `输入的离职前12个月平均工资: ${avgMonthlySalary || 0}元。` });

    if (Number.isNaN(numWorkYears) || numWorkYears < 0 || Number.isNaN(numWorkMonths) || numWorkMonths < 0 || numWorkMonths >= 12) {
      setError("请输入有效的工作年限（年份为非负整数，月份为0-11之间的整数）。");
      return;
    }
    if (Number.isNaN(numAvgMonthlySalary) || numAvgMonthlySalary <= 0) {
      setError("请输入有效的离职前12个月平均工资（大于0的数字）。");
      return;
    }

    if (terminationReason.endsWith('_unnotified')) {
        details.push({ id: 'input-summary-3', text: `输入的解除合同前上月工资: ${lastMonthSalary || 0}元。` });
        if (Number.isNaN(numLastMonthSalary) || numLastMonthSalary <= 0) {
            setError("请输入有效的解除合同前上一个月的工资（大于0的数字）。");
            return;
        }
    }
    if (numLocalAvgSalaryTripled !== null && (Number.isNaN(numLocalAvgSalaryTripled) || numLocalAvgSalaryTripled <= 0)) {
        setError("请输入有效的当地社平工资3倍（可选，若填写则需为大于0的数字）。");
        return;
    }
    if (numLocalAvgSalaryTripled !== null) {
        details.push({ id: 'input-summary-4', text: `输入的当地社平工资3倍: ${localAvgSalaryTripled}元。` });
    }


    // 2. 计算N（工龄折算月数）
    let nCompMonths = 0;
    if (numWorkYears > 0 || numWorkMonths > 0) {
        nCompMonths = numWorkYears;
        if (numWorkMonths >= 6) {
            nCompMonths += 1;
        } else if (numWorkMonths > 0 && numWorkMonths < 6) {
            nCompMonths += 0.5;
        }
    }
    // 如果总工龄不足6个月，按0.5个月计算
    if (numWorkYears === 0 && numWorkMonths > 0 && numWorkMonths < 6) {
        nCompMonths = 0.5;
    }
    // 如果总工龄为0，则N为0
    if (numWorkYears === 0 && numWorkMonths === 0){
        nCompMonths = 0;
    }

    details.push({ id: 'calc-n-months', text: `根据规则，折算经济补偿金的年限 (N) 为: ${nCompMonths}个月。` });

    // 3. 确定月工资基数 (用于N的计算)
    let effectiveMonthlySalaryForN = numAvgMonthlySalary;
    let salaryCapApplied = false;

    if (numLocalAvgSalaryTripled !== null && numAvgMonthlySalary > numLocalAvgSalaryTripled) {
        effectiveMonthlySalaryForN = numLocalAvgSalaryTripled;
        salaryCapApplied = true;
        details.push({ 
            id: 'calc-salary-cap', 
            text: `您的月平均工资(${numAvgMonthlySalary.toFixed(2)}元)高于当地社平工资3倍(${numLocalAvgSalaryTripled.toFixed(2)}元)。经济补偿的月工资基数按社平3倍计算。` 
        });
        // 高收入限制下，补偿年限不超过12年
        if (nCompMonths > 12) {
            details.push({ 
                id: 'calc-year-cap', 
                text: `同时，高收入人群经济补偿的年限上限为12年，原计算年限${nCompMonths}个月已调整为12个月。` 
            });
            nCompMonths = 12; 
        }
    }

    details.push({ id: 'calc-effective-salary', text: `用于计算N部分的月工资基数为: ${effectiveMonthlySalaryForN.toFixed(2)}元。` });

    // 4. 根据 terminationReason 执行具体计算 (后续步骤)
    let totalCompensation = 0;
    let nCompensation: number | undefined = undefined;
    let plusOneCompensation: number | undefined = undefined;
    let twoNCompensation: number | undefined = undefined;

    // --- 模拟后续计算 --- (这部分将在下一步详细实现)
    if (terminationReason === "unlawful_termination") {
        twoNCompensation = nCompMonths * 2 * effectiveMonthlySalaryForN;
        totalCompensation = twoNCompensation;
        details.push({ id: 'calc-2n', text: `适用2N赔偿，总金额为: ${totalCompensation.toFixed(2)}元。` });
    } else if (terminationReason.endsWith('_unnotified')) {
        nCompensation = nCompMonths * effectiveMonthlySalaryForN;
        plusOneCompensation = numLastMonthSalary; // 使用解析后的 numLastMonthSalary
        totalCompensation = nCompensation + plusOneCompensation;
        details.push({ id: 'calc-n', text: `N部分补偿: ${nCompensation.toFixed(2)}元。` });
        details.push({ id: 'calc-plus-one', text: `+1部分(代通知金): ${plusOneCompensation.toFixed(2)}元。` });
        details.push({ id: 'calc-total-n-plus-one', text: `N+1 总金额为: ${totalCompensation.toFixed(2)}元。` });
    } else {
        nCompensation = nCompMonths * effectiveMonthlySalaryForN;
        totalCompensation = nCompensation;
        details.push({ id: 'calc-n-only', text: `适用N补偿，总金额为: ${totalCompensation.toFixed(2)}元。` });
    }
    // --- 模拟结束 ---

    setResult({
        totalCompensation,
        nMonths: nCompMonths,
        nCompensation,
        plusOneCompensation,
        twoNCompensation,
        calculationDetails: details
    });
  };

  const handleReasonChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setTerminationReason(e.target.value as TerminationReason);
    // 当N+1情形时，上月工资变为相关输入
    if (e.target.value.endsWith('_unnotified')) {
      // 可以在此添加逻辑，比如高亮"上月工资"输入框
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>N+1 经济补偿金模拟器</h1>
      </header>
      <main className={styles.main}>
        <form onSubmit={handleSubmit} className={styles.calculatorForm}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="workYears">在本单位工作年限 (年):</label>
              <input
                type="number"
                id="workYears"
                value={workYears}
                onChange={(e) => setWorkYears(e.target.value)}
                placeholder="例如: 3"
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="workMonths">在本单位工作年限 (月):</label>
              <input
                type="number"
                id="workMonths"
                value={workMonths}
                onChange={(e) => setWorkMonths(e.target.value)}
                placeholder="例如: 7"
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="avgMonthlySalary">离职前12个月平均工资 (元):</label>
              <input
                type="number"
                id="avgMonthlySalary"
                value={avgMonthlySalary}
                onChange={(e) => setAvgMonthlySalary(e.target.value)}
                placeholder="例如: 10000"
              />
              <small>含津贴、绩效，不含年终奖等</small>
            </div>
             {/* 当地社平工资三倍输入，条件显示 */}
            <div className={styles.formGroup}>
                <label htmlFor="localAvgSalaryTripled">当地社平工资3倍 (元，可选):</label>
                <input
                type="number"
                id="localAvgSalaryTripled"
                value={localAvgSalaryTripled}
                onChange={(e) => setLocalAvgSalaryTripled(e.target.value)}
                placeholder="例如: 25000"
                />
                <small>用于高收入限制判断</small>
            </div>

            <div className={styles.formGroupFull}>
              <label htmlFor="terminationReason">解除劳动合同的情形:</label>
              <select id="terminationReason" value={terminationReason} onChange={handleReasonChange}>
                <option value="negotiated_severance">协商一致解除</option>
                <option value="economic_layoff_notified">经济性裁员（已提前30天通知）</option>
                <option value="contract_expired_employer_not_renew">劳动合同到期用人单位不续签</option>
                <option value="medical_leave_expired_notified">医疗期满不能工作（已提前30天通知）</option>
                <option value="incompetent_notified">不胜任工作（已提前30天通知）</option>
                <option value="objective_change_notified">客观情况重大变化（已提前30天通知）</option>
                <option value="medical_leave_expired_unnotified">医疗期满不能工作（未提前30天通知，计算N+1）</option>
                <option value="incompetent_unnotified">不胜任工作（未提前30天通知，计算N+1）</option>
                <option value="objective_change_unnotified">客观情况重大变化（未提前30天通知，计算N+1）</option>
                <option value="unlawful_termination">用人单位违法解除或终止劳动合同 (计算2N)</option>
              </select>
            </div>

            {/* 上月工资输入，条件显示，当选择N+1情形时更突出或变为必填 */}
            {(terminationReason.endsWith('_unnotified') || terminationReason === "medical_leave_expired_unnotified" || terminationReason === "incompetent_unnotified" || terminationReason === "objective_change_unnotified" ) && (
              <div className={styles.formGroup}>
                <label htmlFor="lastMonthSalary">解除合同前上月工资 (元, 用于+1):</label>
                <input
                  type="number"
                  id="lastMonthSalary"
                  value={lastMonthSalary}
                  onChange={(e) => setLastMonthSalary(e.target.value)}
                  placeholder="例如: 9800"
                  required={terminationReason.endsWith('_unnotified')} // 条件必填
                />
              </div>
            )}
          </div>

          <div className={styles.actions}>
            <button type="submit" className={styles.primaryButton}>开始计算</button>
            <button type="button" className={styles.secondaryButton} onClick={() => {
              setWorkYears("");
              setWorkMonths("");
              setAvgMonthlySalary("");
              setLastMonthSalary("");
              setLocalAvgSalaryTripled("");
              setTerminationReason("negotiated_severance");
              setResult(null);
              setError("");
            }}>重置表单</button>
          </div>
        </form>

        {error && <p className={styles.errorText}>{error}</p>}

        {result && (
          <div className={styles.resultSection} ref={resultSectionRef}>
            <h2>计算结果</h2>
            <p className={styles.totalCompensation}>
              总补偿金额: 
              <strong>{result.totalCompensation.toFixed(2)} 元</strong>
            </p>
            <div className={styles.resultDetails}>
              {result.nMonths !== undefined && <p>N (工龄折算月数): {result.nMonths}个月</p>}
              {result.nCompensation !== undefined && <p>N (经济补偿金部分): {result.nCompensation.toFixed(2)}元</p>}
              {result.plusOneCompensation !== undefined && <p>+1 (代通知金部分): {result.plusOneCompensation.toFixed(2)}元</p>}
              {result.twoNCompensation !== undefined && <p>2N (违法解除赔偿金): {result.twoNCompensation.toFixed(2)}元</p>}
              <h4>计算依据与说明:</h4>
              <ul>
                {result.calculationDetails.map((detail) => (
                  <li key={detail.id}>{detail.text}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <footer className={styles.footer}>
          <div className={styles.visitorCounterContainer}>
            {/* 这里是新的访客计数器 UI */}
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.visitorIcon}>
              <title>访客图标</title>
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            <span>站点总访问: {visitorCount} 次</span>
          </div>
          <p className={styles.disclaimer}>免责声明：本模拟器计算结果仅供参考，不具有法律效力。具体金额请以劳动行政部门、劳动仲裁机构或人民法院的最终认定为准。</p>
        </footer>
      </main>
    </div>
  );
}
