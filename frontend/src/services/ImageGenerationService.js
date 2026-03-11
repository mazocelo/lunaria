export class ImageGenerationService {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/image';
  }

  async generate({ entityType, entityData, options }) {
    try {
      const response = await this.apiClient.post(`${this.baseUrl}/generate`, {
        entityType,
        entityData,
        ...(options && { options }),
      });
      if (response.success) return response;
      throw new Error(response.error || 'Erro desconhecido');
    } catch (error) {
      throw new Error(`Erro ao gerar imagem: ${error.message}`);
    }
  }
}
