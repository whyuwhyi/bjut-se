/**
 * Markdown渲染工具函数
 * 支持常用的Markdown语法转换为HTML
 */

export function renderMarkdown(content) {
	if (!content) return ''
	
	let html = content
	
	// 1. 标题渲染 (# ## ### #### ##### ######)
	html = html.replace(/^######\s+(.*$)/gm, '<h6 style="font-size: 24rpx; font-weight: bold; margin: 15rpx 0; color: #666;">$1</h6>')
	html = html.replace(/^#####\s+(.*$)/gm, '<h5 style="font-size: 26rpx; font-weight: bold; margin: 15rpx 0; color: #666;">$1</h5>')
	html = html.replace(/^####\s+(.*$)/gm, '<h4 style="font-size: 28rpx; font-weight: bold; margin: 18rpx 0; color: #555;">$1</h4>')
	html = html.replace(/^###\s+(.*$)/gm, '<h3 style="font-size: 32rpx; font-weight: bold; margin: 20rpx 0; color: #333;">$1</h3>')
	html = html.replace(/^##\s+(.*$)/gm, '<h2 style="font-size: 36rpx; font-weight: bold; margin: 25rpx 0; color: #333;">$1</h2>')
	html = html.replace(/^#\s+(.*$)/gm, '<h1 style="font-size: 40rpx; font-weight: bold; margin: 30rpx 0; color: #333;">$1</h1>')
	
	// 2. 粗体和斜体
	html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
	html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: bold;">$1</strong>')
	html = html.replace(/\*(.*?)\*/g, '<em style="font-style: italic;">$1</em>')
	
	// 3. 代码块和行内代码
	html = html.replace(/```([\s\S]*?)```/g, '<pre style="background: #f8f8f8; padding: 20rpx; border-radius: 8rpx; margin: 20rpx 0; font-family: monospace; overflow-x: auto; white-space: pre-wrap;"><code>$1</code></pre>')
	html = html.replace(/`(.*?)`/g, '<code style="background: #f5f5f5; padding: 4rpx 8rpx; border-radius: 4rpx; font-family: monospace; color: #d63384;">$1</code>')
	
	// 4. 链接
	html = html.replace(/\[([^\]]*)\]\(([^)]*)\)/g, '<a href="$2" style="color: #007aff; text-decoration: underline;">$1</a>')
	
	// 5. 图片
	html = html.replace(/!\[([^\]]*)\]\(([^)]*)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto; margin: 20rpx 0; border-radius: 8rpx;" />')
	
	// 6. 有序列表
	html = html.replace(/^\d+\.\s+(.*$)/gm, '<li style="margin: 8rpx 0; padding-left: 10rpx;">$1</li>')
	
	// 7. 无序列表
	html = html.replace(/^[-*+]\s+(.*$)/gm, '<li style="margin: 8rpx 0; padding-left: 10rpx; list-style-type: disc;">$1</li>')
	
	// 8. 包装列表项
	html = html.replace(/(<li[^>]*>.*<\/li>)/gs, function(match) {
		if (match.includes('</ul>') || match.includes('</ol>')) return match
		return '<ul style="margin: 15rpx 0; padding-left: 30rpx;">' + match + '</ul>'
	})
	
	// 9. 引用块
	html = html.replace(/^>\s+(.*$)/gm, '<blockquote style="border-left: 4rpx solid #ddd; padding-left: 20rpx; margin: 20rpx 0; color: #666; font-style: italic;">$1</blockquote>')
	
	// 10. 水平分割线
	html = html.replace(/^---$/gm, '<hr style="border: none; border-top: 1rpx solid #ddd; margin: 30rpx 0;" />')
	html = html.replace(/^\*\*\*$/gm, '<hr style="border: none; border-top: 1rpx solid #ddd; margin: 30rpx 0;" />')
	
	// 11. 删除线
	html = html.replace(/~~(.*?)~~/g, '<del style="text-decoration: line-through; color: #999;">$1</del>')
	
	// 12. 表格 (简单处理)
	html = html.replace(/\|(.+)\|/g, function(match, p1) {
		const cells = p1.split('|').map(cell => cell.trim()).filter(cell => cell)
		const cellsHtml = cells.map(cell => `<td style="padding: 8rpx 12rpx; border: 1rpx solid #ddd;">${cell}</td>`).join('')
		return `<tr>${cellsHtml}</tr>`
	})
	html = html.replace(/(<tr>.*<\/tr>)/gs, '<table style="border-collapse: collapse; margin: 20rpx 0; width: 100%;">$1</table>')
	
	// 13. 段落处理 - 将双换行转换为段落
	html = html.replace(/\n\n/g, '</p><p style="margin: 16rpx 0; line-height: 1.6;">')
	html = '<p style="margin: 16rpx 0; line-height: 1.6;">' + html + '</p>'
	
	// 14. 单换行转换为<br>
	html = html.replace(/\n/g, '<br>')
	
	// 15. 清理空段落
	html = html.replace(/<p[^>]*><\/p>/g, '')
	
	return html
}

/**
 * 获取纯文本摘要 (移除Markdown标记)
 * @param {string} content - Markdown内容
 * @param {number} maxLength - 最大长度
 * @returns {string} 纯文本摘要
 */
export function getPlainTextExcerpt(content, maxLength = 100) {
	if (!content) return ''
	
	// 移除各种markdown标记
	let plainText = content
		.replace(/^#{1,6}\s+/gm, '') // 移除标题标记
		.replace(/\*\*\*(.*?)\*\*\*/g, '$1') // 移除粗斜体
		.replace(/\*\*(.*?)\*\*/g, '$1') // 移除粗体
		.replace(/\*(.*?)\*/g, '$1') // 移除斜体
		.replace(/~~(.*?)~~/g, '$1') // 移除删除线
		.replace(/`(.*?)`/g, '$1') // 移除行内代码
		.replace(/```[\s\S]*?```/g, '[代码块]') // 代码块替换为标记
		.replace(/!\[([^\]]*)\]\(([^)]*)\)/g, '[图片: $1]') // 图片替换为标记
		.replace(/\[([^\]]*)\]\(([^)]*)\)/g, '$1') // 移除链接但保留文本
		.replace(/^[-*+]\s+/gm, '') // 移除列表标记
		.replace(/^\d+\.\s+/gm, '') // 移除有序列表标记
		.replace(/^>\s+/gm, '') // 移除引用标记
		.replace(/^---$/gm, '') // 移除水平线
		.replace(/\n+/g, ' ') // 换行转空格
		.replace(/\s+/g, ' ') // 合并多个空格
		.trim()
	
	return plainText.length > maxLength ? plainText.substring(0, maxLength) + '...' : plainText
}