import React, { useState, useEffect } from 'react';
import { useDrawing } from '../../contexts/DrawingContext';
import { showToast, showInputError } from '../../utils/paramProcessor';
import { testApiKey } from '../../services/api';
import { validateApiKey } from '../../utils/validators';
import useImageGeneration from '../../hooks/useImageGeneration';

/**
 * API密钥设置模态框组件
 * 用于设置、测试和移除API密钥
 */
function ApiKeyModal({ isOpen, onClose }) {
  const { state, setApiKey, refreshStamina } = useDrawing();
  const { getDrawingParams } = useImageGeneration();
  const [inputApiKey, setInputApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inputError, setInputError] = useState('');

  // 当模态框打开时，加载当前API密钥
  useEffect(() => {
    if (isOpen) {
      setInputApiKey(state.apiKey || '');
      setInputError('');
    }
  }, [isOpen, state.apiKey]);

  // 关闭模态框
  const handleClose = () => {
    onClose();
  };

  // 验证输入的API密钥
  const validateInput = (apiKey) => {
    const validationResult = validateApiKey(apiKey);
    
    if (!validationResult.isValid) {
      setInputError(validationResult.error);
      return false;
    }
    
    setInputError('');
    return true;
  };

  // 保存API密钥
  const handleSave = () => {
    const trimmedKey = inputApiKey.trim();
    
    // 验证API密钥
    if (!validateInput(trimmedKey)) {
      showInputError(document.querySelector('.api-key-input'), inputError);
      return;
    }
    
    setApiKey(trimmedKey);
    showToast('API密钥已保存', 3000, false);
    onClose();
  };

  // 测试API密钥
  const handleTest = async () => {
    const trimmedKey = inputApiKey.trim();
    
    // 验证API密钥
    if (!validateInput(trimmedKey)) {
      showInputError(document.querySelector('.api-key-input'), inputError);
      return;
    }
    
    setIsLoading(true);
    try {
      // 使用getDrawingParams获取格式化参数
      const paramsResult = getDrawingParams();
      
      if (!paramsResult.params) {
        throw new Error(paramsResult.error || '获取参数失败');
      }
      
      // 补充一些测试专用的参数
      const testParams = {
        ...paramsResult.params,
        prompt: paramsResult.params.prompt || '测试API请求示例，测试生成',
        negativePrompt: paramsResult.params.negativePrompt || '低质量，模糊',
        count: 1,
        // 使用提供的参数中的API密钥作为回退
        jjddApiKey: trimmedKey || paramsResult.params.jjddApiKey
      };
      
      console.log('使用统一格式参数进行API测试', testParams);
      
      // 调用API测试函数
      const result = await testApiKey(trimmedKey, testParams);
      
      if (result.valid) {
        // 显示预估的体力消耗和体力信息
        showToast(
          `API密钥有效! ${result.consumeStamina ? `预估消耗体力: ${result.consumeStamina}` : ''}`, 
          4000, 
          false
        );
        
        // 刷新体力信息
        try {
          await refreshStamina(trimmedKey);
        } catch (error) {
          console.error('刷新体力信息失败:', error);
        }
      } else {
        if (result.error === 'INVALID_FORMAT') {
          setInputError('API密钥格式不正确！');
          showInputError(document.querySelector('.api-key-input'), '格式不正确！');
        } else {
          showToast(`API密钥无效: ${result.error}`, 3000, true);
        }
      }
    } catch (error) {
      console.error('API密钥测试失败:', error);
      showToast(`API密钥测试失败: ${error.message}`, 3000, true);
    } finally {
      setIsLoading(false);
    }
  };

  // 移除API密钥
  const handleRemove = () => {
    setInputApiKey('');
    setInputError('');
    setApiKey('');
    showToast('API密钥已移除', 3000, false);
    onClose();
  };

  // 如果模态框关闭则不渲染
  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={handleClose}></div>
      <div className="modal api-key-modal">
        <div className="modal-content">
          <div className="modal-header">
            <h4>JJDD API Key</h4>
            <button 
              className="close-modal-btn" 
              onClick={handleClose}
              aria-label="关闭"
            >
              ×
            </button>
          </div>
          <div className="modal-body">
            <input 
              type="text" 
              className={`api-key-input ${inputError ? 'input-error' : ''}`}
              placeholder="请输入您的API密钥"
              value={inputApiKey}
              onChange={(e) => {
                setInputApiKey(e.target.value);
                // 清除输入错误
                if (inputError) setInputError('');
              }}
              disabled={isLoading}
            />
            {inputError && (
              <div className="error-message">{inputError}</div>
            )}
          </div>
          <div className="modal-footer">
            <button 
              className="modal-btn save-btn" 
              onClick={handleSave}
              disabled={isLoading}
            >
              保存
            </button>
            <button 
              className="modal-btn test-btn" 
              onClick={handleTest}
              disabled={isLoading}
            >
              {isLoading ? '测试中...' : '测试API'}
            </button>
            <button 
              className="modal-btn remove-btn" 
              onClick={handleRemove}
              disabled={isLoading}
            >
              移除密钥
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default ApiKeyModal; 